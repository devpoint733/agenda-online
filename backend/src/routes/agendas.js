const express = require("express");
const pool = require("../config/database");
const { loadAgendaAccess, requireProprietario } = require("../middlewares/agendaAccess");
const agendaNested = require("./agendaNested");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, ua.papel
       FROM agendas a
       INNER JOIN usuario_agenda ua ON ua.agenda_id = a.id
       WHERE ua.usuario_id = ?
       ORDER BY a.nome`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar agendas." });
  }
});

router.post("/", async (req, res) => {
  const { nome, slug_agenda, ativo } = req.body;
  if (!nome || !slug_agenda) {
    return res.status(400).json({ error: "Campos obrigatórios: nome, slug_agenda." });
  }
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const [r] = await conn.query("INSERT INTO agendas (nome, slug_agenda, ativo) VALUES (?, ?, ?)", [
      nome,
      slug_agenda,
      ativo != null ? ativo : 1,
    ]);
    await conn.query(
      "INSERT INTO usuario_agenda (usuario_id, agenda_id, papel) VALUES (?, ?, 'proprietario')",
      [req.user.id, r.insertId]
    );
    await conn.commit();
    const [[ag]] = await conn.query("SELECT * FROM agendas WHERE id = ?", [r.insertId]);
    res.status(201).json(ag);
  } catch (error) {
    if (conn) await conn.rollback();
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "slug_agenda já está em uso." });
    }
    res.status(500).json({ error: "Erro ao criar agenda." });
  } finally {
    if (conn) conn.release();
  }
});

router.get("/:agendaId", loadAgendaAccess, async (req, res) => {
  try {
    const [[row]] = await pool.query("SELECT * FROM agendas WHERE id = ?", [req.params.agendaId]);
    if (!row) return res.status(404).json({ error: "Agenda não encontrada." });
    res.json({ ...row, meu_papel: req.agendaPapel });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar agenda." });
  }
});

router.put("/:agendaId", loadAgendaAccess, requireProprietario, async (req, res) => {
  const { nome, slug_agenda, ativo } = req.body;
  if (!nome || !slug_agenda) {
    return res.status(400).json({ error: "Campos obrigatórios: nome, slug_agenda." });
  }
  try {
    const [result] = await pool.query(
      "UPDATE agendas SET nome = ?, slug_agenda = ?, ativo = ? WHERE id = ?",
      [nome, slug_agenda, ativo != null ? ativo : 1, req.params.agendaId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Agenda não encontrada." });
    const [[row]] = await pool.query("SELECT * FROM agendas WHERE id = ?", [req.params.agendaId]);
    res.json(row);
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "slug_agenda já está em uso." });
    }
    res.status(500).json({ error: "Erro ao atualizar agenda." });
  }
});

router.delete("/:agendaId", loadAgendaAccess, requireProprietario, async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM agendas WHERE id = ?", [req.params.agendaId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Agenda não encontrada." });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir agenda." });
  }
});

router.use("/:agendaId", loadAgendaAccess, agendaNested);

module.exports = router;
