const express = require("express");
const pool = require("../config/database");

const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM excecoes_calendario WHERE agenda_id = ? ORDER BY data_excecao",
      [req.params.agendaId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar exceções do calendário." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM excecoes_calendario WHERE id = ? AND agenda_id = ?",
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
  const { data_excecao, fechado_o_dia, hora_inicio, hora_fim, observacao } = req.body;
  if (!data_excecao) {
    return res.status(400).json({ error: "Campo obrigatório: data_excecao." });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO excecoes_calendario (agenda_id, data_excecao, fechado_o_dia, hora_inicio, hora_fim, observacao)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.params.agendaId,
        data_excecao,
        fechado_o_dia != null ? fechado_o_dia : 1,
        hora_inicio ?? null,
        hora_fim ?? null,
        observacao ?? null,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM excecoes_calendario WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Exceção duplicada para esta combinação de data/janela." });
    }
    res.status(500).json({ error: "Erro ao criar exceção." });
  }
});

router.put("/:id", async (req, res) => {
  const { data_excecao, fechado_o_dia, hora_inicio, hora_fim, observacao } = req.body;
  if (!data_excecao) {
    return res.status(400).json({ error: "Campo obrigatório: data_excecao." });
  }
  try {
    const [result] = await pool.query(
      `UPDATE excecoes_calendario SET data_excecao = ?, fechado_o_dia = ?, hora_inicio = ?, hora_fim = ?, observacao = ?
       WHERE id = ? AND agenda_id = ?`,
      [
        data_excecao,
        fechado_o_dia != null ? fechado_o_dia : 1,
        hora_inicio ?? null,
        hora_fim ?? null,
        observacao ?? null,
        req.params.id,
        req.params.agendaId,
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Registro não encontrado." });
    const [rows] = await pool.query("SELECT * FROM excecoes_calendario WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Exceção duplicada para esta combinação de data/janela." });
    }
    res.status(500).json({ error: "Erro ao atualizar exceção." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM excecoes_calendario WHERE id = ? AND agenda_id = ?",
      [req.params.id, req.params.agendaId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Registro não encontrado." });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir exceção." });
  }
});

module.exports = router;
