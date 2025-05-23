const db = require('../db'); 

const agregar = (req,res) => {
    const { id_usuario, id_producto, cantidad } = req.body;

    if (!id_usuario || !id_producto || !cantidad || cantidad <= 0) {
        return res.status(400).json({ 
            success: false, 
            message: "Datos inválidos. Se requiere id_usuario, id_producto y cantidad positiva." 
        });
    }

    const sqlVerificarStock = `
        SELECT cantidad FROM productos 
        WHERE id_producto = ? AND activo = 1
    `;

    db.query(sqlVerificarStock, [id_producto], (err, resultadosStock) => {
        if (err) {
            console.error("Error al verificar stock:", err);
            return res.status(500).json({ 
                success: false, 
                message: "Error del servidor al verificar stock" 
            });
        }

        if (resultadosStock.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Producto no encontrado o no está activo" 
            });
        }

        const stockDisponible = resultadosStock[0].cantidad;

        if (stockDisponible < cantidad) {
            return res.status(400).json({ 
                success: false, 
                message: `Stock insuficiente. Solo hay ${stockDisponible} unidades disponibles.` 
            });
        }

        // Verificar si el producto ya está en el carrito del usuario
        const sqlVerificarCarrito = `
            SELECT id_carrito, cantidad FROM carrito 
            WHERE id_usuario = ? AND id_producto = ?
        `;

        db.query(sqlVerificarCarrito, [id_usuario, id_producto], (err, resultadosCarrito) => {
            if (err) {
                console.error("Error al verificar carrito:", err);
                return res.status(500).json({ 
                    success: false, 
                    message: "Error del servidor al verificar carrito" 
                });
            }

            // Si el producto ya está en el carrito, actualizar la cantidad
            if (resultadosCarrito.length > 0) {
                const idCarrito = resultadosCarrito[0].id_carrito;
                const cantidadActual = resultadosCarrito[0].cantidad;
                const nuevaCantidad = cantidadActual + cantidad;

                // Verificar que la nueva cantidad no exceda el stock
                if (nuevaCantidad > stockDisponible) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `No se puede agregar ${cantidad} unidades más. Excedería el stock disponible.` 
                    });
                }

                const sqlActualizar = `
                    UPDATE carrito 
                    SET cantidad = ?, fecha_agregado = CURRENT_TIMESTAMP 
                    WHERE id_carrito = ?
                `;

                db.query(sqlActualizar, [nuevaCantidad, idCarrito], (err, resultadosActualizar) => {
                    if (err) {
                        console.error("Error al actualizar carrito:", err);
                        return res.status(500).json({ 
                            success: false, 
                            message: "Error del servidor al actualizar carrito" 
                        });
                    }

                    return res.status(200).json({ 
                        success: true, 
                        message: "Cantidad actualizada en el carrito exitosamente" 
                    });
                });
            } 
            // Si el producto no está en el carrito, insertarlo
            else {
                const sqlInsertar = `
                    INSERT INTO carrito (id_usuario, id_producto, cantidad)
                    VALUES (?, ?, ?)
                `;

                db.query(sqlInsertar, [id_usuario, id_producto, cantidad], (err, resultadosInsertar) => {
                    if (err) {
                        console.error("Error al insertar en carrito:", err);
                        return res.status(500).json({ 
                            success: false, 
                            message: "Error del servidor al agregar al carrito" 
                        });
                    }

                    return res.status(201).json({ 
                        success: true, 
                        message: "Producto agregado al carrito exitosamente" 
                    });
                });
            }
        });
    });

}

//mostrar carrito de cada usuario
const carritoUsuario = (req, res) => {
    const idUsuario = req.params.id_usuario;
    console.log("Solicitud de carrito para usuario con id:", idUsuario);

    const sql = `
        SELECT 
            c.id_usuario,
            c.id_producto,
            c.cantidad,
            p.foto,
            p.precio
        FROM 
            carrito c
        JOIN 
            productos p ON c.id_producto = p.id_producto 
        WHERE
            c.id_usuario = ?
    `;
    
    db.query(sql, [idUsuario], (err, results) => {
        
        if (err) {
            console.error("Error en la consulta SQL:", err);
            return res.status(500).json({ 
                success: false, 
                error: "Error del servidor" 
            });
        }
        
        return res.json({
            success: true,
            carrito: results
        });
    });
}


const eliminarDelCarrito = (req,res) => {
    const idUsuario = req.params.id_usuario;
    const idProducto = req.params.id_producto;
    
    console.log(`Eliminando producto ${idProducto} del carrito del usuario ${idUsuario}`);
    
    if (!idUsuario || !idProducto) {
        return res.status(400).json({
            success: false,
            error: "Faltan parámetros requeridos"
        });
    }
    
    const sql = `
        DELETE FROM carrito 
        WHERE id_usuario = ? AND id_producto = ?
    `;
    
    db.query(sql, [idUsuario, idProducto], (err, result) => {
        if (err) {
            console.error("Error al eliminar producto del carrito:", err);
            return res.status(500).json({
                success: false,
                error: "Error al eliminar producto del carrito"
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: "Producto no encontrado en el carrito"
            });
        }

        return res.json({
            success: true,
            message: "Producto eliminado del carrito"
        });
    });

}


const pagar = (req, res) => {
    const { id_usuario, total } = req.body;

    const insertarPedido = `
        INSERT INTO pedido (id_usuario, total, estado)
        VALUES (?, ?, 'Pendiente')
    `;

    db.query(insertarPedido, [id_usuario, total], (err, result) => {
        if (err) {
            console.error("Error al crear pedido:", err);
            return res.status(500).json({
                success: false,
                message: "Error del servidor al crear el pedido"
            });
        }

        const idPedido = result.insertId;

        const obtenerCarrito = `
            SELECT c.id_producto, c.cantidad, (c.cantidad * p.precio) AS subtotal
            FROM carrito c
            JOIN productos p ON c.id_producto = p.id_producto
            WHERE c.id_usuario = ?
        `;

        db.query(obtenerCarrito, [id_usuario], (err2, productos) => {
            if (err2) {
                console.error("Error al obtener productos del carrito:", err2);
                return res.status(500).json({
                    success: false,
                    message: "Pedido creado, pero error al obtener productos del carrito"
                });
            }

            if (productos.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "El carrito está vacío"
                });
            }

            const detalles = productos.map(p => [
                idPedido,
                p.id_producto,
                p.cantidad,
                p.subtotal
            ]);

            const insertarDetalles = `
                INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, subtotal)
                VALUES ?
            `;

            db.query(insertarDetalles, [detalles], (err3) => {
                if (err3) {
                    console.error("Error al insertar detalles:", err3);
                    return res.status(500).json({
                        success: false,
                        message: "Pedido creado, pero error al guardar los detalles"
                    });
                }

                const actualizarStock = `
                    UPDATE productos
                    SET cantidad = cantidad - ?
                    WHERE id_producto = ?
                `;

                productos.forEach((p) => {
                    db.query(actualizarStock, [p.cantidad, p.id_producto], (err4) => {
                        if (err4) {
                            console.error(`Error al actualizar stock del producto ${p.id_producto}:`, err4);
                        }
                    });
                });

                const vaciarCarrito = `DELETE FROM carrito WHERE id_usuario = ?`;
                db.query(vaciarCarrito, [id_usuario], (err5) => {
                    if (err5) {
                        console.error("Error al vaciar carrito:", err5);
                    }
                });

                return res.status(201).json({
                    success: true,
                    message: "Pedido y detalles registrados con éxito",
                    id_pedido: idPedido
                });
            });
        });
    });
};



module.exports = {
    agregar,
    carritoUsuario,
    eliminarDelCarrito,
    pagar

}