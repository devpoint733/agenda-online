const pool = require("../config/database");

/**
 * req.params.agendaId — exige usuário autenticado (verifyToken antes).
 */
async function loadAgendaAccess(req, res, next) {
  const agendaId = req.params.agendaId;
  if (agendaId == null || agendaId === "") {
    return res.status(400).json({ error: "agendaId obrigatório." });
  }

  try {
    const [rows] = await pool.query(
      "SELECT papel FROM usuario_agenda WHERE usuario_id = ? AND agenda_id = ?",
      [req.user.id, agendaId]
    );
    if (rows.length === 0) {
      return res.status(403).json({ error: "Sem acesso a esta agenda." });
    }
    req.agendaPapel = rows[0].papel;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao verificar permissão na agenda." });
  }
}

function requireProprietario(req, res, next) {
  if (req.agendaPapel !== "proprietario") {
    return res.status(403).json({ error: "Apenas o proprietário pode executar esta ação." });
  }
  next();
}

module.exports = { loadAgendaAccess, requireProprietario };
