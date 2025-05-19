const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidos.controller');

router.get('/:idUsuario', pedidosController.obtenerPedidosPorUsuario);
router.get('/detalle/:idPedido', pedidosController.obtenerDetallePedido)
router.get('/', pedidosController.obtenerTodosPedidos)

module.exports = router;