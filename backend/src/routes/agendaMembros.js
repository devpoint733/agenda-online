const express = require("express");
const pool = require("../config/database");
const { requireProprietario } = require("../middlewares/agendaAccess");

const router = express.Router({ mergeParams: true });

const PAPEIS = ["proprietario", "colaborador"];

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ua.id, ua.usuario_id, ua.papel, ua.criado_em, u.nome, u.email, u.telefone
       FROM usuario_agenda ua
       INNER JOIN usuarios u ON u.id = ua.usuario_id
       WHERE ua.agenda_id = ?
       ORDER BY ua.papel, u.nome`,
      [req.params.agendaId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar membros." });
  }
});

router.post("/", requireProprietario, async (req, res) => {
  const { email, papel } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Campo obrigatório: email." });
  }
  const pap = papel && PAPEIS.includes(papel) ? papel : "colaborador";
  try {
    const [users] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: "Nenhum usuário encontrado com este e-mail." });
    }
    const usuarioId = users[0].id;
    const [result] = await pool.query(
      "INSERT INTO usuario_agenda (usuario_id, agenda_id, papel) VALUES (?, ?, ?)",
      [usuarioId, req.params.agendaId, pap]
    );
    const [rows] = await pool.query(
      `SELECT ua.id, ua.usuario_id, ua.papel, ua.criado_em, u.nome, u.email
       FROM usuario_agenda ua
       INNER JOIN usuarios u ON u.id = ua.usuario_id
       WHERE ua.id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Este usuário já está vinculado à agenda." });
    }
    res.status(500).json({ error: "Erro ao vincular membro." });
  }
});

router.delete("/:usuarioId", requireProprietario, async (req, res) => {
  try {
    const agendaId = req.params.agendaId;
    const usuarioId = req.params.usuarioId;

    const [proprietarios] = await pool.query(
      "SELECT id FROM usuario_agenda WHERE agenda_id = ? AND papel = 'proprietario'",
      [agendaId]
    );
    const [[alvo]] = await pool.query(
      "SELECT papel FROM usuario_agenda WHERE agenda_id = ? AND usuario_id = ?",
      [agendaId, usuarioId]
    );
    if (!alvo) return res.status(404).json({ error: "Membro não encontrado nesta agenda." });
    if (alvo.papel === "proprietario" && proprietarios.length <= 1) {
      return res.status(400).json({ error: "Não é possível remover o único proprietário da agenda." });
    }

    const [result] = await pool.query(
      "DELETE FROM usuario_agenda WHERE agenda_id = ? AND usuario_id = ?",
      [agendaId, usuarioId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Membro não encontrado." });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao remover membro." });
  }
});

module.exports = router;
