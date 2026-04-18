const express = require("express");
const pool = require("../config/database");

const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM servicos WHERE agenda_id = ? ORDER BY ordem, nome",
      [req.params.agendaId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar serviços." });
  }
});

router.get("/:servicoId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM servicos WHERE id = ? AND agenda_id = ?",
      [req.params.servicoId, req.params.agendaId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Serviço não encontrado." });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar serviço." });
  }
});

router.post("/", async (req, res) => {
  const { nome, descricao, duracao_minutos, preco, ativo, ordem } = req.body;
  if (!nome || duracao_minutos == null) {
    return res.status(400).json({ error: "Campos obrigatórios: nome, duracao_minutos." });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO servicos (agenda_id, nome, descricao, duracao_minutos, preco, ativo, ordem)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.agendaId,
        nome,
        descricao ?? null,
        duracao_minutos,
        preco ?? null,
        ativo != null ? ativo : 1,
        ordem != null ? ordem : 0,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM servicos WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar serviço." });
  }
});

router.put("/:servicoId", async (req, res) => {
  const { nome, descricao, duracao_minutos, preco, ativo, ordem } = req.body;
  if (!nome || duracao_minutos == null) {
    return res.status(400).json({ error: "Campos obrigatórios: nome, duracao_minutos." });
  }
  try {
    const [result] = await pool.query(
      `UPDATE servicos SET nome = ?, descricao = ?, duracao_minutos = ?, preco = ?, ativo = ?, ordem = ?
       WHERE id = ? AND agenda_id = ?`,
      [
        nome,
        descricao ?? null,
        duracao_minutos,
        preco ?? null,
        ativo != null ? ativo : 1,
        ordem != null ? ordem : 0,
        req.params.servicoId,
        req.params.agendaId,
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Serviço não encontrado." });
    const [rows] = await pool.query("SELECT * FROM servicos WHERE id = ?", [req.params.servicoId]);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar serviço." });
  }
});

router.delete("/:servicoId", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM servicos WHERE id = ? AND agenda_id = ?", [
      req.params.servicoId,
      req.params.agendaId,
    ]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Serviço não encontrado." });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir serviço." });
  }
});

module.exports = router;
