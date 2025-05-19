const express = require('express');
const router = express.Router();
const carritoController = require('../controllers/carrito.controller');


router.post('/agregar', carritoController.agregar);
router.get('/:id_usuario', carritoController.carritoUsuario);
router.post('/pagar', carritoController.pagar)
router.delete('/:id_usuario/:id_producto', carritoController.eliminarDelCarrito)


module.exports = router;