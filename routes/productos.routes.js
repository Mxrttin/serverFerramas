const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');

router.get('/', productosController.obtenerProductos);

router.post('/agregarProducto', productosController.agregarProductos)

router.put('/modificarProducto/:id_producto', productosController.modificarProducto)

router.get('/:id_producto', productosController.obtenerProductosId)


module.exports = router;