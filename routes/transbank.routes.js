const express = require('express');
const router = express.Router();
const transbankController = require('../controllers/transbank.controller');

router.post('/iniciar', transbankController.iniciarPago);
router.post('/confirmar', transbankController.confirmarPago);

module.exports = router;
