const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const verifyToken = require("../middlewares/auth");

const router = express.Router();
const saltRounds = 10;

router.use(verifyToken);

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nome, email, telefone, criado_em, atualizado_em FROM usuarios ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar usuários." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nome, email, telefone, criado_em, atualizado_em FROM usuarios WHERE id = ?",
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
  const { nome, email, senha, telefone } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: "Campos obrigatórios: nome, email e senha." });
  }

  try {
    const [existing] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "E-mail já cadastrado." });
    }

    const senhaHash = await bcrypt.hash(senha, saltRounds);

    const [result] = await pool.query(
      "INSERT INTO usuarios (nome, email, senha, telefone) VALUES (?, ?, ?, ?)",
      [nome, email, senhaHash, telefone ?? null]
    );

    const [rows] = await pool.query(
      "SELECT id, nome, email, telefone, criado_em, atualizado_em FROM usuarios WHERE id = ?",
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar usuário." });
  }
});

router.put("/:id", async (req, res) => {
  const { nome, email, telefone, senha } = req.body;

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
    let result;

    if (trocarSenha) {
      const senhaHash = await bcrypt.hash(String(senha).trim(), saltRounds);
      [result] = await pool.query(
        "UPDATE usuarios SET nome = ?, email = ?, telefone = ?, senha = ? WHERE id = ?",
        [nome, email, telefone ?? null, senhaHash, req.params.id]
      );
    } else {
      [result] = await pool.query("UPDATE usuarios SET nome = ?, email = ?, telefone = ? WHERE id = ?", [
        nome,
        email,
        telefone ?? null,
        req.params.id,
      ]);
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const [rows] = await pool.query(
      "SELECT id, nome, email, telefone, criado_em, atualizado_em FROM usuarios WHERE id = ?",
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
