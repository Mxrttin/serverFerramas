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

exports.obtenerTodosPedidos = (req, res) => {
    const sql = `SELECT * FROM pedido`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error en la consulta SQL:", err.message);
            return res.status(500).json({ error: "Error del servidor" });
        }

        res.json({
            success: true,
            pedidos: results
        });
    });
}

exports.obtenerDetallePedido = (req, res) =>{
    const idPedido = req.params.idPedido;

    const sql = `
        SELECT dp.id_producto,
            dp.cantidad,
            dp.subtotal,
            pro.foto,
            pro.nombre AS nombre_producto,
            u.nombre AS nombre_usuario,
            u.apellido,
            u.correo,
            u.telefono,
            u.rut,
            p.estado,
            d.direccion,
            d.comuna,
            d.ciudad,
            d.region
        FROM detalle_pedido dp
        JOIN productos pro ON pro.id_producto = dp.id_producto
        JOIN pedido p ON p.id_pedido = dp.id_pedido
        JOIN usuarios u ON u.id_usuario = p.id_usuario
        LEFT JOIN direccion d ON d.id_usuario = u.id_usuario
        WHERE dp.id_pedido = ?
    `;
    db.query(sql, [idPedido], (err, result) =>{
        if(err){
            console.error("Error en la consulta SQL:", err.message);
            return res.status(500).json({error: "Error del servidor"});
        }
        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "No se encontró el detalle del pedido" });
        }
        res.json({
            success: true,
            detalle: result
        });
    })
}
