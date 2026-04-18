const axios = require("axios");

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME;

/**
 * Envia mensagem de texto via Evolution API.
 * @param {string} telefone - Numero com DDI (ex: "5511999999999")
 * @param {string} mensagem
 */
async function enviarMensagemWhatsApp(telefone, mensagem) {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
    throw new Error("Variáveis da Evolution API não configuradas (EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME).");
  }

  const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`;

  const { data } = await axios.post(
    url,
    {
      number: telefone,
      text: mensagem,
    },
    {
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      timeout: 15000,
    }
  );

  return data;
}

module.exports = { enviarMensagemWhatsApp };
