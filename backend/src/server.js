console.log("Iniciando servidor...");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const routes = require("./routes");

const app = express();

const defaultOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

/** Uma URL do front em produção (ex.: https://front-agenda-online.vercel.app) */
const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "").trim();

const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...(frontendUrl ? [frontendUrl] : []), ...envOrigins])];

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Deploy do front na Vercel (produção + previews, ex.: front-agenda-online-git-main-xxx.vercel.app)
  try {
    const u = new URL(origin);
    if (u.protocol === "https:" && u.hostname.endsWith(".vercel.app") && u.hostname.startsWith("front-agenda-online")) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(routes);

// Definir porta dinâmica para produção ou desenvolvimento
const port = process.env.PORT || 3000;

// Iniciar o servidor apenas se rodando localmente
if (require.main === module) {
    const server = app.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Porta ${port} em uso, tentando outra...`);
            app.listen(0, () => {
                console.log(`Servidor rodando em uma porta aleatória`);
            });
        } else {
            console.error(err);
        }
    });
}

// Exportamos o app para a Vercel
module.exports = app;
