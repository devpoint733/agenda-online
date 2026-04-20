const express = require("express");
const pool = require("../config/database");

const router = express.Router();

function toDateTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${String(timeStr).slice(0, 8)}`);
}

function toMySqlDateTime(dateObj) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())} ${pad(
    dateObj.getHours()
  )}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
}

function addMinutes(dateObj, minutes) {
  return new Date(dateObj.getTime() + minutes * 60000);
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

async function getAgendaBySlug(slug) {
  const [rows] = await pool.query("SELECT * FROM agendas WHERE slug_agenda = ? AND ativo = 1 LIMIT 1", [slug]);
  return rows[0] || null;
}

async function getEffectiveWindows(agendaId, date) {
  const [exceptions] = await pool.query(
    "SELECT * FROM excecoes_calendario WHERE agenda_id = ? AND data_excecao = ?",
    [agendaId, date]
  );

  if (exceptions.length > 0) {
    if (exceptions.some((e) => Number(e.fechado_o_dia) === 1)) return [];
    return exceptions
      .filter((e) => e.hora_inicio && e.hora_fim)
      .map((e) => ({ hora_inicio: e.hora_inicio, hora_fim: e.hora_fim }));
  }

  const weekday = new Date(`${date}T00:00:00`).getDay();
  const [weekly] = await pool.query(
    "SELECT hora_inicio, hora_fim FROM disponibilidade_semanal WHERE agenda_id = ? AND dia_semana = ? ORDER BY hora_inicio",
    [agendaId, weekday]
  );
  return weekly;
}

router.get("/agendas/:slug", async (req, res) => {
  try {
    const agenda = await getAgendaBySlug(req.params.slug);
    if (!agenda) return res.status(404).json({ error: "Agenda não encontrada." });

    const [servicos] = await pool.query(
      "SELECT id, nome, descricao, duracao_minutos, preco FROM servicos WHERE agenda_id = ? AND ativo = 1 ORDER BY ordem, nome",
      [agenda.id]
    );
    const [campos] = await pool.query(
      "SELECT id, chave_campo, rotulo, tipo_campo, opcoes_json, obrigatorio, ordem FROM definicoes_campos_coleta WHERE agenda_id = ? ORDER BY ordem, id",
      [agenda.id]
    );

    res.json({
      agenda: { id: agenda.id, nome: agenda.nome, slug_agenda: agenda.slug_agenda },
      servicos,
      campos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao carregar agenda pública." });
  }
});

router.get("/agendas/:slug/disponibilidade", async (req, res) => {
  const { date, servico_id } = req.query;
  if (!date || !servico_id) {
    return res.status(400).json({ error: "Parâmetros obrigatórios: date, servico_id." });
  }

  try {
    const agenda = await getAgendaBySlug(req.params.slug);
    if (!agenda) return res.status(404).json({ error: "Agenda não encontrada." });

    const [[servico]] = await pool.query(
      "SELECT id, duracao_minutos FROM servicos WHERE id = ? AND agenda_id = ? AND ativo = 1",
      [servico_id, agenda.id]
    );
    if (!servico) return res.status(404).json({ error: "Serviço não encontrado." });

    const windows = await getEffectiveWindows(agenda.id, date);
    if (windows.length === 0) return res.json({ slots: [], grade: [] });

    const [bookings] = await pool.query(
      `SELECT inicio_em, fim_em FROM agendamentos
       WHERE agenda_id = ?
         AND DATE(inicio_em) = ?
         AND situacao IN ('pendente', 'confirmado')`,
      [agenda.id, date]
    );

    const now = new Date();
    const slots = [];
    const grade = [];
    const stepMinutes = 15;

    windows.forEach((w) => {
      const startWindow = toDateTime(date, w.hora_inicio);
      const endWindow = toDateTime(date, w.hora_fim);
      let cursor = new Date(startWindow);

      while (addMinutes(cursor, Number(servico.duracao_minutos)) <= endWindow) {
        const endCandidate = addMinutes(cursor, Number(servico.duracao_minutos));
        const hasOverlap = bookings.some((b) =>
          overlaps(cursor, endCandidate, new Date(b.inicio_em), new Date(b.fim_em))
        );

        const isPast = cursor <= now;
        const status = hasOverlap ? "ocupado" : isPast ? "passado" : "disponivel";

        grade.push({
          inicio_em: toMySqlDateTime(cursor),
          fim_em: toMySqlDateTime(endCandidate),
          status,
        });

        if (status === "disponivel") {
          slots.push({
            inicio_em: toMySqlDateTime(cursor),
            fim_em: toMySqlDateTime(endCandidate),
          });
        }
        cursor = addMinutes(cursor, stepMinutes);
      }
    });

    res.json({ slots, grade });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao calcular disponibilidade." });
  }
});

router.post("/agendas/:slug/agendamentos", async (req, res) => {
  const { servico_id, inicio_em, nome_completo, email, telefone, mensagem_cliente, respostas } = req.body;
  if (!servico_id || !inicio_em || !nome_completo || !email || !telefone) {
    return res.status(400).json({
      error: "Campos obrigatórios: servico_id, inicio_em, nome_completo, email, telefone.",
    });
  }

  let conn;
  try {
    const agenda = await getAgendaBySlug(req.params.slug);
    if (!agenda) return res.status(404).json({ error: "Agenda não encontrada." });

    const [[servico]] = await pool.query(
      "SELECT id, duracao_minutos FROM servicos WHERE id = ? AND agenda_id = ? AND ativo = 1",
      [servico_id, agenda.id]
    );
    if (!servico) return res.status(404).json({ error: "Serviço não encontrado." });

    const inicio = new Date(String(inicio_em).replace(" ", "T"));
    if (Number.isNaN(inicio.getTime())) {
      return res.status(400).json({ error: "inicio_em inválido." });
    }
    const fim = addMinutes(inicio, Number(servico.duracao_minutos));

    const [conflicts] = await pool.query(
      `SELECT id FROM agendamentos
       WHERE agenda_id = ?
         AND situacao IN ('pendente', 'confirmado')
         AND inicio_em < ?
         AND fim_em > ?
       LIMIT 1`,
      [agenda.id, toMySqlDateTime(fim), toMySqlDateTime(inicio)]
    );
    if (conflicts.length > 0) {
      return res.status(409).json({ error: "Horário indisponível. Escolha outro horário." });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    let clienteId;
    const [existingClient] = await conn.query("SELECT id FROM clientes WHERE agenda_id = ? AND email = ? LIMIT 1", [
      agenda.id,
      email,
    ]);
    if (existingClient.length > 0) {
      clienteId = existingClient[0].id;
      await conn.query(
        "UPDATE clientes SET nome_completo = ?, telefone = ?, atualizado_em = CURRENT_TIMESTAMP(3) WHERE id = ?",
        [nome_completo, telefone, clienteId]
      );
    } else {
      const [createdClient] = await conn.query(
        "INSERT INTO clientes (agenda_id, nome_completo, email, telefone) VALUES (?, ?, ?, ?)",
        [agenda.id, nome_completo, email, telefone]
      );
      clienteId = createdClient.insertId;
    }

    const [createdBooking] = await conn.query(
      `INSERT INTO agendamentos (agenda_id, cliente_id, servico_id, inicio_em, fim_em, situacao, mensagem_cliente)
       VALUES (?, ?, ?, ?, ?, 'confirmado', ?)`,
      [agenda.id, clienteId, servico_id, toMySqlDateTime(inicio), toMySqlDateTime(fim), mensagem_cliente ?? null]
    );

    if (Array.isArray(respostas)) {
      for (const r of respostas) {
        if (!r || r.definicao_campo_id == null || r.valor_texto == null) continue;
        await conn.query(
          `INSERT INTO respostas_campos_agendamento (agendamento_id, definicao_campo_id, valor_texto)
           VALUES (?, ?, ?)`,
          [createdBooking.insertId, r.definicao_campo_id, String(r.valor_texto)]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ id: createdBooking.insertId, message: "Agendamento criado com sucesso." });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Dados duplicados nos campos enviados." });
    }
    res.status(500).json({ error: "Erro ao criar agendamento público." });
  } finally {
    if (conn) conn.release();
  }
});

router.get("/agendas/:slug/agendamentos/:agendamentoId", async (req, res) => {
  try {
    const agenda = await getAgendaBySlug(req.params.slug);
    if (!agenda) return res.status(404).json({ error: "Agenda não encontrada." });

    const [rows] = await pool.query(
      `SELECT
         ag.id,
         ag.inicio_em,
         ag.fim_em,
         ag.situacao,
         ag.mensagem_cliente,
         c.nome_completo,
         c.email,
         c.telefone,
         s.nome AS servico_nome,
         s.duracao_minutos
       FROM agendamentos ag
       INNER JOIN clientes c ON c.id = ag.cliente_id
       INNER JOIN servicos s ON s.id = ag.servico_id
       WHERE ag.id = ? AND ag.agenda_id = ?
       LIMIT 1`,
      [req.params.agendamentoId, agenda.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    res.json({ agendamento: rows[0], agenda: { id: agenda.id, nome: agenda.nome, slug_agenda: agenda.slug_agenda } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao carregar agendamento público." });
  }
});

module.exports = router;
