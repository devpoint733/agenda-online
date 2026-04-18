console.log("Iniciando servidor...");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const routes = require("./routes");

const app = express();

const defaultOrigins = [
  "https://jm-lanches-x5dz.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
