const express = require("express");
const pool = require("../config/database");

const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM disponibilidade_semanal WHERE agenda_id = ? ORDER BY dia_semana, hora_inicio",
      [req.params.agendaId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar disponibilidade semanal." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM disponibilidade_semanal WHERE id = ? AND agenda_id = ?",
      [req.params.id, req.params.agendaId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Registro não encontrado." });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar registro." });
  }
});

router.post("/", async (req, res) => {
  const { dia_semana, hora_inicio, hora_fim } = req.body;
  if (dia_semana == null || !hora_inicio || !hora_fim) {
    return res.status(400).json({ error: "Campos obrigatórios: dia_semana, hora_inicio, hora_fim." });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO disponibilidade_semanal (agenda_id, dia_semana, hora_inicio, hora_fim) VALUES (?, ?, ?, ?)",
      [req.params.agendaId, dia_semana, hora_inicio, hora_fim]
    );
    const [rows] = await pool.query("SELECT * FROM disponibilidade_semanal WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar disponibilidade." });
  }
});

router.put("/:id", async (req, res) => {
  const { dia_semana, hora_inicio, hora_fim } = req.body;
  if (dia_semana == null || !hora_inicio || !hora_fim) {
    return res.status(400).json({ error: "Campos obrigatórios: dia_semana, hora_inicio, hora_fim." });
  }
  try {
    const [result] = await pool.query(
      `UPDATE disponibilidade_semanal SET dia_semana = ?, hora_inicio = ?, hora_fim = ?
       WHERE id = ? AND agenda_id = ?`,
      [dia_semana, hora_inicio, hora_fim, req.params.id, req.params.agendaId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Registro não encontrado." });
    const [rows] = await pool.query("SELECT * FROM disponibilidade_semanal WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar disponibilidade." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM disponibilidade_semanal WHERE id = ? AND agenda_id = ?",
      [req.params.id, req.params.agendaId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Registro não encontrado." });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir disponibilidade." });
  }
});

module.exports = router;
