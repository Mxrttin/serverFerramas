const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")



require('dotenv').config();



app.use(cors());
app.use(express.json()); 

const JWT_SECRET = process.env.JWT_SECRET

// Conexión a base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error("Error al conectar a la base de datos:", err.message);
    } else {
        console.log("Conexión a MySQL exitosa.")
    }
});

// Ruta para obtener todos los usuarios
app.get("/", (req, res) => {
    db.query("SELECT * FROM usuarios", (err, results) => {
        if (err) {
            return res.status(500).send("Error en la consulta");
        }
        res.json(results)
    })
});

// Ruta para login
app.post("/login",(req, res) => {
    const { email, password } = req.body;
    
    console.log("Intento de login:", email);  
    
    const sql = "SELECT * FROM usuarios WHERE correo = ?";
    
    db.query(sql, [email], async(err, results) => {
        if (err) {
            console.error("Error en la consulta SQL:", err);
            return res.status(500).json({ error: "Error del servidor" });
        }

        if (results.length > 0) {
            const usuario = results[0];

            const match = await bcrypt.compare(password, usuario.clave)
            if (!match) return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
            
            const payload = {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo,
                telefono: usuario.telefono,
                rut: usuario.rut,
                rol: usuario.rol
            };

            const token = jwt.sign(payload, JWT_SECRET, {expiresIn: "1h"})

            res.json({success: true, token})
            
        } else {
            res.status(401).json({ success: false, message: "Correo no encontrado" });
        }
    });
});

// Ruta para obtener pedidos por rut de usuario
app.get("/pedidos/:rutUsuario", (req, res) => {
    const rutUsuario = req.params.rutUsuario;
    
    console.log("Consultando pedidos para el usuario con RUT:", rutUsuario);

    const sql = `
        SELECT 
            p.id_pedido, 
            p.fecha_pedido, 
            p.total, 
            p.estado
        FROM 
            pedido p
        WHERE 
            p.rut_usuario = ?
        ORDER BY 
            p.fecha_pedido DESC
    `;

    db.query(sql, [rutUsuario], (err, results) => {
        if (err) {
            console.error("Error en la consulta SQL:", err.message);
            return res.status(500).json({error: "Error del servidor"});
        }

        res.json({
            success: true,
            pedidos: results
        });
    });
});

//Insertar usuarios
app.put("/registroUsuario", async (req, res) => {
  const { rut, nombre, correo, telefono, clave } = req.body;

  console.log("Insertando nuevo usuario:", req.body);

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(clave, salt);

    const sql = `
        INSERT INTO usuarios (rut, nombre, correo, telefono, clave, rol)
        VALUES (?, ?, ?, ?, ?, 2)
    `;

    db.query(sql, [rut, nombre, correo, telefono, hashedPassword], (err, result) => {
        if (err) {
            console.error("Error en la consulta SQL:", err);
            return res.status(500).json({ success: false, message: "Error al registrar usuario" });
        }

        return res.status(200).json({ success: true, message: "Usuario registrado exitosamente" });
    });
  }catch (err){
    res.status(500).json({error: "Error en el servidor"})
  };
});

//insertar producto
app.put("/agregarProductos", (req,res) =>{

    const {nombre,descripcion,marca,precio,cantidad,categoria,foto} = req.body;

    const sql = `
        INSERT INTO productos (nombre,descripcion,marca,precio,cantidad,categoria,foto)
        VALUES (?,?,?,?,?,?,?)    
    `
    db.query(sql,[nombre,descripcion,marca,precio,cantidad,categoria,foto], (err,result) =>{
        if(err){
            console.error("Error en la consulta SQL:", err);
            return res.status(500).json({success: false, message:"Error del servidor"});

        }
        return res.status(200).json({success: true, message: "Producto registrado exitosamente"})
    });

});

//agregar direccion
app.put("/agregarDireccion", (req, res) =>{

    const {direccion, comuna, ciudad, region, id_usuario} = req.body;

    const sql= `
        INSERT INTO direccion (direccion, comuna, ciudad, region, id_usuario) 
        VALUES (?,?,?,?,?)
    `
    db.query(sql, [direccion, comuna, ciudad, region, id_usuario], (err) =>{
        if(err){
            console.error("Error en la consulta SQL:", err);
            return res.status(500).json({success: false, message:"Error del servidor"});
        }
        return res.status(200).json({success: true, message: "Producto registrado exitosamente"})
    });
});


//modificar producto

app.put("/modificarProducto/:id", (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, marca, precio, cantidad, categoria, foto } = req.body;

  const sql = `
    UPDATE productos 
    SET nombre = ?, descripcion = ?, marca = ?, precio = ?, cantidad = ?, categoria = ?, foto = ? 
    WHERE id_producto = ?
  `;

  db.query(sql, [nombre, descripcion, marca, precio, cantidad, categoria, foto, id], (err, result) => {
    if (err) {
      console.error("Error en la consulta SQL:", err);
      return res.status(500).json({ success: false, message: "Error del servidor" });
    }

    return res.status(200).json({ success: true, message: "Producto modificado exitosamente" });
  });
});

//modificar direccion
app.put("/modificarDireccion/:id", (req, res) => {
  const id = req.params.id;  // <- Aquí
  const { direccion, comuna, ciudad, region } = req.body;

  const sql = `
    UPDATE direccion
    SET direccion = ?, comuna = ?, ciudad = ?, region = ? 
    WHERE id_usuario = ?
  `;
  db.query(sql, [direccion, comuna, ciudad, region, id], (err) => {
    if (err) {
      console.error("Error en la consulta SQL:", err);
      return res.status(500).json({ success: false, message: "Error del servidor" });
    }

    return res.status(200).json({ success: true, message: "Dirección modificada exitosamente" }); 
  });
});



//cargar productos
app.get("/productos", (req, res) => {
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
});

//cargar categorias
app.get("/categorias", (req,res)=>{
    const sql = "SELECT * FROM categorias";

    db.query(sql, (err, results) =>{
        if(err){
            console.error("Error en la consulta SQL:", err);
            return res.status(500).json({error: "Error en el servidor"});
        }

        res.json({
            success: true,
            categorias: results,
        })
    })
})

//cargar productos por id_producto

app.get("/categorias/:id_categoria", (req, res) => {
    const id_categoria = req.params.id_categoria;

    const sql = "SELECT * FROM productos WHERE categoria = ?";

    db.query(sql, [id_categoria], (err, results) => {

        if (err) {
            console.error("Error en la consulta SQL:", err);
            return res.status(500).json({ error: "Error del servidor" });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No se encontraron productos para esta categoría"
            });
        }

        // Devuelve todos los productos encontrados (en lugar de solo uno)
        res.json({
            success: true,
            productos: results  // Cambié 'producto' por 'productos' para reflejar que es un array
        });
    });
});

//cargarproductos por id

app.get("/productos/:id_producto", (req, res) => {
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
});

//agregar al carrito
app.post("/carrito/agregar", (req, res) => {
    const { rut_usuario, id_producto, cantidad } = req.body;

    if (!rut_usuario || !id_producto || !cantidad || cantidad <= 0) {
        return res.status(400).json({ 
            success: false, 
            message: "Datos inválidos. Se requiere rut_usuario, id_producto y cantidad positiva." 
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
            WHERE rut_usuario = ? AND id_producto = ?
        `;

        db.query(sqlVerificarCarrito, [rut_usuario, id_producto], (err, resultadosCarrito) => {
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
                    INSERT INTO carrito (rut_usuario, id_producto, cantidad)
                    VALUES (?, ?, ?)
                `;

                db.query(sqlInsertar, [rut_usuario, id_producto, cantidad], (err, resultadosInsertar) => {
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
});

//mostrar carrito de cada usuario
app.get("/carrito/:rut_usuario", (req, res) => {
    const rutUsuario = req.params.rut_usuario;
    console.log("Solicitud de carrito para:", rutUsuario);

    const sql = `
        SELECT 
            c.rut_usuario,
            c.id_producto,
            c.cantidad,
            p.foto,
            p.precio
        FROM 
            carrito c
        JOIN 
            productos p ON c.id_producto = p.id_producto 
        WHERE
            c.rut_usuario = ?
    `;
    
    db.query(sql, [rutUsuario], (err, results) => {
        
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
});

//eliminar producto del carrito
app.delete("/carrito/:rut_usuario/:id_producto", (req, res) => {
    const rutUsuario = req.params.rut_usuario;
    const idProducto = req.params.id_producto;
    
    console.log(`Eliminando producto ${idProducto} del carrito del usuario ${rutUsuario}`);
    
    if (!rutUsuario || !idProducto) {
        return res.status(400).json({
            success: false,
            error: "Faltan parámetros requeridos"
        });
    }
    
    const sql = `
        DELETE FROM carrito 
        WHERE rut_usuario = ? AND id_producto = ?
    `;
    
    db.query(sql, [rutUsuario, idProducto], (err, result) => {
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
});

// Middleware para validar token y extraer usuario
function verificarToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No autorizado' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.usuario = decoded;
    next();
  });
}

// obtener direccion de usuario
app.get('/direccion', verificarToken, (req, res) => {
  const id_usuario = req.usuario.id_usuario;

  const sql = 'SELECT direccion, comuna, ciudad, region FROM direccion WHERE id_usuario = ?';

  db.query(sql, [id_usuario], (err, results) => {
    if (err) {
      console.error('Error en la consulta SQL:', err);
      return res.status(500).json({ success: false, message: 'Error del servidor' });
    }

    if (results.length > 0) {
      res.json({ success: true, direccion: results[0] });
    } else {
      res.json({ success: false, message: 'No se encontró dirección' });
    }
  });
});



// Iniciar el servidor
app.listen(3000, () => {
    console.log("Server running on port", 3000)
});