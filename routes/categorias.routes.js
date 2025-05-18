const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categorias.controller');

router.get('/', categoriaController.categorias)
router.get('/:id_categoria', categoriaController.categoriaID)




module.exports = router;