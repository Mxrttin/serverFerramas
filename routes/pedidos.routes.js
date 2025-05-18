const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidos.controller');

router.get('/:rutUsuario', pedidosController.obtenerPedidosPorUsuario);

module.exports = router;