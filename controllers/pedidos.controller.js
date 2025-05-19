const db = require('../db');

exports.obtenerPedidosPorUsuario = (req, res) => {
    const idUsuario = req.params.idUsuario;
    
    const sql = `
        SELECT 
            p.id_pedido, 
            p.fecha_pedido, 
            p.total, 
            p.estado
        FROM 
            pedido p
        WHERE 
            p.id_usuario = ?
        ORDER BY 
            p.fecha_pedido DESC
    `;

    db.query(sql, [idUsuario], (err, results) => {
        if (err) {
            console.error("Error en la consulta SQL:", err.message);
            return res.status(500).json({error: "Error del servidor"});
        }

        res.json({
            success: true,
            pedidos: results
        });
    });
};
