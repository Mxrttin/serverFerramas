const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken")
const direccionController = require('../controllers/direccion.controller');
const JWT_SECRET = process.env.JWT_SECRET

require('dotenv').config();

function verificarToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No autorizado' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.usuario = decoded;
    next();
  });
}


router.put('/agregarDireccion', direccionController.agregarDireccion)
router.put('/modificarDireccion/:id', direccionController.modificarDireccion)
router.get('/direccionUsuario',verificarToken, direccionController.direccionUsuario)

module.exports = router;