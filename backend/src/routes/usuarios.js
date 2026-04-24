const express = require("express");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const verifyToken = require("../middlewares/auth");
const { uploadImageBuffer } = require("../utils/cloudinaryImage");

const router = express.Router();
const saltRounds = 10;

function normalizeAvatarUrl(value) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  return s.length > 2000 ? s.slice(0, 2000) : s;
}

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    if (!ok) {
      cb(new Error("Use uma imagem JPEG, PNG, WebP ou GIF."));
      return;
    }
    cb(null, true);
  },
});

router.use(verifyToken);

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nome, email, telefone, avatar_url, criado_em, atualizado_em FROM usuarios ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar usuários." });
  }
});

router.post("/avatar", (req, res, next) => {
  avatarUpload.single("imagem")(req, res, (err) => {
    if (err) {
      const msg = err.message || "Arquivo inválido.";
      return res.status(400).json({ error: msg });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Envie uma imagem no campo imagem." });
  }
  const userId = req.user.id;
  try {
    const publicId = `u${userId}_${Date.now()}`;
    const url = await uploadImageBuffer(req.file.buffer, req.file.mimetype, {
      folder: "agenda_online/avatars",
      public_id: publicId,
    });
    await pool.query("UPDATE usuarios SET avatar_url = ? WHERE id = ?", [url, userId]);
    const [rows] = await pool.query(
      "SELECT id, nome, email, telefone, avatar_url, criado_em, atualizado_em FROM usuarios WHERE id = ?",
      [userId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    res.json({ avatar_url: rows[0].avatar_url, user: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Falha ao enviar imagem. Verifique o Cloudinary no servidor." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nome, email, telefone, avatar_url, criado_em, atualizado_em FROM usuarios WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar usuário." });
  }
});

router.post("/", async (req, res) => {
  const { nome, email, senha, telefone, avatar_url } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: "Campos obrigatórios: nome, email e senha." });
  }

  try {
    const [existing] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "E-mail já cadastrado." });
    }

    const senhaHash = await bcrypt.hash(senha, saltRounds);
    const avatar = normalizeAvatarUrl(avatar_url);

    const [result] = await pool.query(
      "INSERT INTO usuarios (nome, email, senha, telefone, avatar_url) VALUES (?, ?, ?, ?, ?)",
      [nome, email, senhaHash, telefone ?? null, avatar]
    );

    const [rows] = await pool.query(
      "SELECT id, nome, email, telefone, avatar_url, criado_em, atualizado_em FROM usuarios WHERE id = ?",
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar usuário." });
  }
});

router.put("/:id", async (req, res) => {
  const { nome, email, telefone, senha, avatar_url } = req.body;

  if (!nome || !email) {
    return res.status(400).json({ error: "Campos obrigatórios: nome e email." });
  }

  try {
    const [duplicado] = await pool.query("SELECT id FROM usuarios WHERE email = ? AND id != ?", [
      email,
      req.params.id,
    ]);
    if (duplicado.length > 0) {
      return res.status(400).json({ error: "E-mail já cadastrado." });
    }

    const trocarSenha = senha != null && String(senha).trim() !== "";
    let avatarFinal;
    if (Object.prototype.hasOwnProperty.call(req.body, "avatar_url")) {
      avatarFinal = normalizeAvatarUrl(avatar_url);
    } else {
      const [[cur]] = await pool.query("SELECT avatar_url FROM usuarios WHERE id = ?", [req.params.id]);
      avatarFinal = cur ? cur.avatar_url : null;
    }
    let result;

    if (trocarSenha) {
      const senhaHash = await bcrypt.hash(String(senha).trim(), saltRounds);
      [result] = await pool.query(
        "UPDATE usuarios SET nome = ?, email = ?, telefone = ?, avatar_url = ?, senha = ? WHERE id = ?",
        [nome, email, telefone ?? null, avatarFinal, senhaHash, req.params.id]
      );
    } else {
      [result] = await pool.query(
        "UPDATE usuarios SET nome = ?, email = ?, telefone = ?, avatar_url = ? WHERE id = ?",
        [nome, email, telefone ?? null, avatarFinal, req.params.id]
      );
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const [rows] = await pool.query(
      "SELECT id, nome, email, telefone, avatar_url, criado_em, atualizado_em FROM usuarios WHERE id = ?",
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar usuário." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM usuarios WHERE id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir usuário." });
  }
});

module.exports = router;
