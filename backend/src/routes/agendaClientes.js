const express = require("express");
const pool = require("../config/database");

const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM clientes WHERE agenda_id = ? ORDER BY nome_completo",
      [req.params.agendaId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar clientes." });
  }
});

router.get("/:clienteId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM clientes WHERE id = ? AND agenda_id = ?",
      [req.params.clienteId, req.params.agendaId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Cliente não encontrado." });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar cliente." });
  }
});

router.post("/", async (req, res) => {
  const { nome_completo, email, telefone, observacoes } = req.body;
  if (!nome_completo || !email || !telefone) {
    return res.status(400).json({ error: "Campos obrigatórios: nome_completo, email, telefone." });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO clientes (agenda_id, nome_completo, email, telefone, observacoes) VALUES (?, ?, ?, ?, ?)",
      [req.params.agendaId, nome_completo, email, telefone, observacoes ?? null]
    );
    const [rows] = await pool.query("SELECT * FROM clientes WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Já existe cliente com este e-mail nesta agenda." });
    }
    res.status(500).json({ error: "Erro ao criar cliente." });
  }
});

router.put("/:clienteId", async (req, res) => {
  const { nome_completo, email, telefone, observacoes } = req.body;
  if (!nome_completo || !email || !telefone) {
    return res.status(400).json({ error: "Campos obrigatórios: nome_completo, email, telefone." });
  }
  try {
    const [result] = await pool.query(
      `UPDATE clientes SET nome_completo = ?, email = ?, telefone = ?, observacoes = ?
       WHERE id = ? AND agenda_id = ?`,
      [nome_completo, email, telefone, observacoes ?? null, req.params.clienteId, req.params.agendaId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Cliente não encontrado." });
    const [rows] = await pool.query("SELECT * FROM clientes WHERE id = ?", [req.params.clienteId]);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Já existe cliente com este e-mail nesta agenda." });
    }
    res.status(500).json({ error: "Erro ao atualizar cliente." });
  }
});

router.delete("/:clienteId", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM clientes WHERE id = ? AND agenda_id = ?", [
      req.params.clienteId,
      req.params.agendaId,
    ]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Cliente não encontrado." });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir cliente." });
  }
});

module.exports = router;
