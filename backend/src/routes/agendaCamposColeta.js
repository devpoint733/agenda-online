const express = require("express");
const pool = require("../config/database");

const TIPOS = ["texto", "texto_longo", "telefone", "email", "numero", "selecao"];

const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM definicoes_campos_coleta WHERE agenda_id = ? ORDER BY ordem, id",
      [req.params.agendaId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar campos de coleta." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM definicoes_campos_coleta WHERE id = ? AND agenda_id = ?",
      [req.params.id, req.params.agendaId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Definição não encontrada." });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar definição." });
  }
});

router.post("/", async (req, res) => {
  const { chave_campo, rotulo, tipo_campo, opcoes_json, obrigatorio, ordem } = req.body;
  if (!chave_campo || !rotulo) {
    return res.status(400).json({ error: "Campos obrigatórios: chave_campo, rotulo." });
  }
  const tipo = tipo_campo && TIPOS.includes(tipo_campo) ? tipo_campo : "texto";
  const opcoes = opcoes_json ?? null;
  try {
    const [result] = await pool.query(
      `INSERT INTO definicoes_campos_coleta (agenda_id, chave_campo, rotulo, tipo_campo, opcoes_json, obrigatorio, ordem)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.agendaId,
        chave_campo,
        rotulo,
        tipo,
        opcoes,
        obrigatorio != null ? obrigatorio : 1,
        ordem != null ? ordem : 0,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM definicoes_campos_coleta WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "chave_campo já existe nesta agenda." });
    }
    res.status(500).json({ error: "Erro ao criar definição de campo." });
  }
});

router.put("/:id", async (req, res) => {
  const { chave_campo, rotulo, tipo_campo, opcoes_json, obrigatorio, ordem } = req.body;
  if (!chave_campo || !rotulo) {
    return res.status(400).json({ error: "Campos obrigatórios: chave_campo, rotulo." });
  }
  const tipo = tipo_campo && TIPOS.includes(tipo_campo) ? tipo_campo : "texto";
  const opcoes = opcoes_json ?? null;
  try {
    const [result] = await pool.query(
      `UPDATE definicoes_campos_coleta SET chave_campo = ?, rotulo = ?, tipo_campo = ?, opcoes_json = ?, obrigatorio = ?, ordem = ?
       WHERE id = ? AND agenda_id = ?`,
      [
        chave_campo,
        rotulo,
        tipo,
        opcoes,
        obrigatorio != null ? obrigatorio : 1,
        ordem != null ? ordem : 0,
        req.params.id,
        req.params.agendaId,
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Definição não encontrada." });
    const [rows] = await pool.query("SELECT * FROM definicoes_campos_coleta WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "chave_campo já existe nesta agenda." });
    }
    res.status(500).json({ error: "Erro ao atualizar definição de campo." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM definicoes_campos_coleta WHERE id = ? AND agenda_id = ?",
      [req.params.id, req.params.agendaId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Definição não encontrada." });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir definição de campo." });
  }
});

module.exports = router;
