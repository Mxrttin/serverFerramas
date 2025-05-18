const db = require('../db'); 

// Obtener productos
const obtenerProductos = (req, res) => {
  const sql = "SELECT * FROM productos";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error en la consulta SQL:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }

    res.json({
      success: true,
      productos: results,
    });
  });
};

// Agregar producto
const agregarProductos = (req, res) => {
  const { nombre, descripcion, marca, precio, cantidad, categoria, foto } = req.body;

  const sql = `
    INSERT INTO productos (nombre, descripcion, marca, precio, cantidad, categoria, foto)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nombre, descripcion, marca, precio, cantidad, categoria, foto], (err, result) => {
    if (err) {
      console.error("Error en la consulta SQL:", err);
      return res.status(500).json({ success: false, message: "Error del servidor" });
    }

    return res.status(200).json({ success: true, message: "Producto registrado exitosamente" });
  });
};

// Modificar producto
const modificarProducto = (req, res) => {
  const { id_producto } = req.params;
  const { nombre, descripcion, marca, precio, cantidad, categoria, foto } = req.body;

  const sql = `
    UPDATE productos 
    SET nombre = ?, descripcion = ?, marca = ?, precio = ?, cantidad = ?, categoria = ?, foto = ? 
    WHERE id_producto = ?
  `;

  db.query(sql, [nombre, descripcion, marca, precio, cantidad, categoria, foto, id_producto], (err, result) => {
    if (err) {
      console.error("Error en la consulta SQL:", err);
      return res.status(500).json({ success: false, message: "Error del servidor" });
    }

    return res.status(200).json({ success: true, message: "Producto modificado exitosamente" });
  });
};

//cargar productos por id
const obtenerProductosId = (req, res) =>{
  const id_producto = req.params.id_producto;

    console.log("Consultando detalle del producto con ID:", id_producto);

    const sql = "SELECT * FROM productos WHERE id_producto = ?";

    db.query(sql, [id_producto], (err, results) => {
        if (err) {
            console.error("Error en la consulta SQL:", err);
            return res.status(500).json({ error: "Error del servidor" });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Producto no encontrado"
            });
        }

        res.json({
            success: true,
            producto: results[0]
        });
    });
}

module.exports = {
  obtenerProductos,
  agregarProductos,
  modificarProducto,
  obtenerProductosId
};
