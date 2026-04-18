const express = require("express");
const agendaClientes = require("./agendaClientes");
const agendaServicos = require("./agendaServicos");
const agendaDisponibilidade = require("./agendaDisponibilidade");
const agendaExcecoes = require("./agendaExcecoes");
const agendaCamposColeta = require("./agendaCamposColeta");
const agendaAgendamentos = require("./agendaAgendamentos");
const agendaMembros = require("./agendaMembros");

const router = express.Router({ mergeParams: true });

router.use("/clientes", agendaClientes);
router.use("/servicos", agendaServicos);
router.use("/disponibilidade-semanal", agendaDisponibilidade);
router.use("/excecoes-calendario", agendaExcecoes);
router.use("/campos-coleta", agendaCamposColeta);
router.use("/agendamentos", agendaAgendamentos);
router.use("/membros", agendaMembros);

module.exports = router;
