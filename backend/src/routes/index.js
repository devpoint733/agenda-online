const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth");

const authRoutes = require("./auth");
const usuariosRoutes = require("./usuarios");
const agendasRoutes = require("./agendas");

router.use("/auth", authRoutes);
router.use("/usuarios", usuariosRoutes);
router.use("/agendas", verifyToken, agendasRoutes);

router.get("/", (req, res) => {
  res.send("API rodando!");
});

module.exports = router;
