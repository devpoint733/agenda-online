const express = require("express");
const pool = require("../config/database");

const router = express.Router({ mergeParams: true });

const SITUACOES = ["pendente", "confirmado", "cancelado", "concluido", "nao_compareceu"];

router.get("/", async (req, res) => {
  const { situacao, de, ate } = req.query;
  try {
    let sql = "SELECT * FROM agendamentos WHERE agenda_id = ?";
    const params = [req.params.agendaId];
    if (situacao) {
      sql += " AND situacao = ?";
      params.push(situacao);
    }
    if (de) {
      sql += " AND inicio_em >= ?";
      params.push(de);
    }
    if (ate) {
      sql += " AND inicio_em <= ?";
      params.push(ate);
    }
    sql += " ORDER BY inicio_em";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar agendamentos." });
  }
});

router.get("/:agendamentoId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM agendamentos WHERE id = ? AND agenda_id = ?",
      [req.params.agendamentoId, req.params.agendaId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Agendamento não encontrado." });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar agendamento." });
  }
});

router.post("/", async (req, res) => {
  const { cliente_id, servico_id, inicio_em, fim_em, situacao, mensagem_cliente, observacao_interna } =
    req.body;
  if (!cliente_id || !servico_id || !inicio_em || !fim_em) {
    return res
      .status(400)
      .json({ error: "Campos obrigatórios: cliente_id, servico_id, inicio_em, fim_em." });
  }
  const sit = situacao && SITUACOES.includes(situacao) ? situacao : "confirmado";
  try {
    const [[c]] = await pool.query("SELECT id FROM clientes WHERE id = ? AND agenda_id = ?", [
      cliente_id,
      req.params.agendaId,
    ]);
    if (!c) return res.status(400).json({ error: "Cliente inválido para esta agenda." });
    const [[s]] = await pool.query("SELECT id FROM servicos WHERE id = ? AND agenda_id = ?", [
      servico_id,
      req.params.agendaId,
    ]);
    if (!s) return res.status(400).json({ error: "Serviço inválido para esta agenda." });

    const [result] = await pool.query(
      `INSERT INTO agendamentos (agenda_id, cliente_id, servico_id, inicio_em, fim_em, situacao, mensagem_cliente, observacao_interna)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.agendaId,
        cliente_id,
        servico_id,
        inicio_em,
        fim_em,
        sit,
        mensagem_cliente ?? null,
        observacao_interna ?? null,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM agendamentos WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar agendamento." });
  }
});

router.put("/:agendamentoId", async (req, res) => {
  const { cliente_id, servico_id, inicio_em, fim_em, situacao, mensagem_cliente, observacao_interna } =
    req.body;
  if (!cliente_id || !servico_id || !inicio_em || !fim_em) {
    return res
      .status(400)
      .json({ error: "Campos obrigatórios: cliente_id, servico_id, inicio_em, fim_em." });
  }
  if (!situacao || !SITUACOES.includes(situacao)) {
    return res.status(400).json({ error: "situacao obrigatória (valor do enum)." });
  }
  try {
    const [[c]] = await pool.query("SELECT id FROM clientes WHERE id = ? AND agenda_id = ?", [
      cliente_id,
      req.params.agendaId,
    ]);
    if (!c) return res.status(400).json({ error: "Cliente inválido para esta agenda." });
    const [[s]] = await pool.query("SELECT id FROM servicos WHERE id = ? AND agenda_id = ?", [
      servico_id,
      req.params.agendaId,
    ]);
    if (!s) return res.status(400).json({ error: "Serviço inválido para esta agenda." });

    const sit = situacao;
    const [result] = await pool.query(
      `UPDATE agendamentos SET cliente_id = ?, servico_id = ?, inicio_em = ?, fim_em = ?, situacao = ?, mensagem_cliente = ?, observacao_interna = ?
       WHERE id = ? AND agenda_id = ?`,
      [
        cliente_id,
        servico_id,
        inicio_em,
        fim_em,
        sit,
        mensagem_cliente ?? null,
        observacao_interna ?? null,
        req.params.agendamentoId,
        req.params.agendaId,
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Agendamento não encontrado." });
    const [rows] = await pool.query("SELECT * FROM agendamentos WHERE id = ?", [req.params.agendamentoId]);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar agendamento." });
  }
});

router.patch("/:agendamentoId", async (req, res) => {
  const { situacao, mensagem_cliente, observacao_interna } = req.body;
  if (situacao != null && !SITUACOES.includes(situacao)) {
    return res.status(400).json({ error: "situacao inválida." });
  }
  try {
    const [existing] = await pool.query(
      "SELECT id FROM agendamentos WHERE id = ? AND agenda_id = ?",
      [req.params.agendamentoId, req.params.agendaId]
    );
    if (existing.length === 0) return res.status(404).json({ error: "Agendamento não encontrado." });

    const fields = [];
    const values = [];
    if (situacao != null) {
      fields.push("situacao = ?");
      values.push(situacao);
    }
    if (mensagem_cliente !== undefined) {
      fields.push("mensagem_cliente = ?");
      values.push(mensagem_cliente);
    }
    if (observacao_interna !== undefined) {
      fields.push("observacao_interna = ?");
      values.push(observacao_interna);
    }
    if (fields.length === 0) {
      const [rows] = await pool.query("SELECT * FROM agendamentos WHERE id = ?", [req.params.agendamentoId]);
      return res.json(rows[0]);
    }
    values.push(req.params.agendamentoId, req.params.agendaId);
    await pool.query(`UPDATE agendamentos SET ${fields.join(", ")} WHERE id = ? AND agenda_id = ?`, values);
    const [rows] = await pool.query("SELECT * FROM agendamentos WHERE id = ?", [req.params.agendamentoId]);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar agendamento." });
  }
});

router.delete("/:agendamentoId", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM agendamentos WHERE id = ? AND agenda_id = ?", [
      req.params.agendamentoId,
      req.params.agendaId,
    ]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Agendamento não encontrado." });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir agendamento." });
  }
});

const respostasRouter = express.Router({ mergeParams: true });

respostasRouter.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.* FROM respostas_campos_agendamento r
       INNER JOIN agendamentos a ON a.id = r.agendamento_id
       WHERE r.agendamento_id = ? AND a.agenda_id = ?`,
      [req.params.agendamentoId, req.params.agendaId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar respostas." });
  }
});

respostasRouter.post("/", async (req, res) => {
  const { definicao_campo_id, valor_texto } = req.body;
  if (definicao_campo_id == null || valor_texto === undefined || valor_texto === null) {
    return res.status(400).json({ error: "Campos obrigatórios: definicao_campo_id, valor_texto." });
  }
  const texto = String(valor_texto);
  try {
    const [[ag]] = await pool.query(
      "SELECT id FROM agendamentos WHERE id = ? AND agenda_id = ?",
      [req.params.agendamentoId, req.params.agendaId]
    );
    if (!ag) return res.status(404).json({ error: "Agendamento não encontrado." });
    const [[def]] = await pool.query(
      "SELECT id FROM definicoes_campos_coleta WHERE id = ? AND agenda_id = ?",
      [definicao_campo_id, req.params.agendaId]
    );
    if (!def) return res.status(400).json({ error: "Definição de campo inválida para esta agenda." });

    const [result] = await pool.query(
      "INSERT INTO respostas_campos_agendamento (agendamento_id, definicao_campo_id, valor_texto) VALUES (?, ?, ?)",
      [req.params.agendamentoId, definicao_campo_id, texto]
    );
    const [rows] = await pool.query("SELECT * FROM respostas_campos_agendamento WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Já existe resposta para este campo neste agendamento." });
    }
    res.status(500).json({ error: "Erro ao salvar resposta." });
  }
});

respostasRouter.put("/:respostaId", async (req, res) => {
  const { valor_texto } = req.body;
  if (valor_texto === undefined || valor_texto === null) {
    return res.status(400).json({ error: "valor_texto obrigatório." });
  }
  try {
    const [result] = await pool.query(
      `UPDATE respostas_campos_agendamento r
       INNER JOIN agendamentos a ON a.id = r.agendamento_id
       SET r.valor_texto = ?
       WHERE r.id = ? AND r.agendamento_id = ? AND a.agenda_id = ?`,
      [String(valor_texto), req.params.respostaId, req.params.agendamentoId, req.params.agendaId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Resposta não encontrada." });
    const [rows] = await pool.query("SELECT * FROM respostas_campos_agendamento WHERE id = ?", [
      req.params.respostaId,
    ]);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar resposta." });
  }
});

respostasRouter.delete("/:respostaId", async (req, res) => {
  try {
    const [result] = await pool.query(
      `DELETE r FROM respostas_campos_agendamento r
       INNER JOIN agendamentos a ON a.id = r.agendamento_id
       WHERE r.id = ? AND r.agendamento_id = ? AND a.agenda_id = ?`,
      [req.params.respostaId, req.params.agendamentoId, req.params.agendaId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Resposta não encontrada." });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir resposta." });
  }
});

router.use("/:agendamentoId/respostas", respostasRouter);

module.exports = router;
