const { WebpayPlus, Options, IntegrationApiKeys, Environment } = require('transbank-sdk');
const db = require('../db');

// Configuración de Transbank
const options = new Options(
    '597055555532', // commerceCode
    '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C', // apiKey
    Environment.Integration
);

const webpayplus = new WebpayPlus.Transaction(options);

const iniciarPago = async (req, res) => {
    try {
        const { id_usuario, total } = req.body;

        // Crear pedido en estado pendiente
        const insertarPedido = `
            INSERT INTO pedido (id_usuario, total, estado, fecha_pedido)
            VALUES (?, ?, 'Pendiente', CURRENT_TIMESTAMP)
        `;

        db.query(insertarPedido, [id_usuario, total], async (err, result) => {
            if (err) {
                console.error("Error al crear pedido:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error del servidor al crear el pedido"
                });
            }

            const idPedido = result.insertId;
            const buyOrder = `PEDIDO-${idPedido}`;
            const sessionId = `SESSION-${id_usuario}`;
            const returnUrl = `${process.env.FRONTEND_URL}/pago/respuesta`;

            const response = await webpayplus.create(buyOrder, sessionId, total, returnUrl);

            // Guardar token en la base de datos
            const actualizarToken = `
                UPDATE pedido 
                SET token_transbank = ? 
                WHERE id_pedido = ?
            `;

            db.query(actualizarToken, [response.token, idPedido], (err) => {
                if (err) {
                    console.error("Error al guardar token:", err);
                }
            });

            res.json({
                success: true,
                url: response.url,
                token: response.token
            });
        });
    } catch (error) {
        console.error("Error en iniciarPago:", error);
        res.status(500).json({
            success: false,
            message: "Error al iniciar el pago"
        });
    }
};

const confirmarPago = async (req, res) => {
    try {
        const { token_ws } = req.body;

        const response = await webpayplus.commit(token_ws);

        if (response.status === 'AUTHORIZED') {
            // Actualizar estado del pedido
            const actualizarPedido = `
                UPDATE pedido 
                SET estado = 'Pagado'
                WHERE token_transbank = ?
            `;

            db.query(actualizarPedido, [token_ws], (err) => {
                if (err) {
                    console.error("Error al actualizar pedido:", err);
                }
            });

            res.json({
                success: true,
                message: "Pago realizado con éxito",
                response: response
            });
        } else {
            res.json({
                success: false,
                message: "Pago rechazado",
                response: response
            });
        }
    } catch (error) {
        console.error("Error en confirmarPago:", error);
        res.status(500).json({
            success: false,
            message: "Error al confirmar el pago"
        });
    }
};

module.exports = {
    iniciarPago,
    confirmarPago
}; 