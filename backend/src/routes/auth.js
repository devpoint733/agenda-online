const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

const router = express.Router();
const saltRounds = 10;

router.post("/register", async (req, res) => {
  const { email, senha, nome, telefone } = req.body;

  if (!email || !senha || !nome) {
    return res.status(400).json({ error: "Campos obrigatórios: email, senha e nome." });
  }

  try {
    const [existingUser] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email]);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "E-mail já cadastrado." });
    }

    const hashedPassword = await bcrypt.hash(senha, saltRounds);

    await pool.query("INSERT INTO usuarios (nome, email, senha, telefone) VALUES (?, ?, ?, ?)", [
      nome,
      email,
      hashedPassword,
      telefone ?? null,
    ]);

    res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao registrar usuário." });
  }
});

router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: "Campos obrigatórios: email e senha." });
  }

  try {
    const [user] = await pool.query(
      `
      SELECT id, nome, email, senha, telefone, avatar_url
      FROM usuarios
      WHERE email = ?
    `,
      [email]
    );

    if (user.length === 0) {
      return res.status(400).json({ error: "E-mail ou senha inválidos." });
    }

    const userData = user[0];

    const validPassword = await bcrypt.compare(senha, userData.senha);

    if (!validPassword) {
      return res.status(400).json({ error: "E-mail ou senha inválidos." });
    }

    const token = jwt.sign(
      { id: userData.id, email: userData.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: userData.id,
        nome: userData.nome,
        email: userData.email,
        telefone: userData.telefone,
        avatar_url: userData.avatar_url ?? null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao fazer login." });
  }
});

module.exports = router;
