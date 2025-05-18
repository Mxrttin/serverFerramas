const express = require("express");
const app = express();
const cors = require("cors");
const db = require('./db')

const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes')
const pedidosRoutes = require('./routes/pedidos.routes');
const categoriasRoutes = require('./routes/categorias.routes')
const direccionController = require('./routes/direccion.routes')
const carritoController = require('./routes/carrito.routes')

require('dotenv').config();

app.use(cors());
app.use(express.json()); 
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/direccion',direccionController);
app.use('/api/carrito',carritoController);


// Iniciar el servidor
app.listen(3000, () => {
    console.log("Server running on port", 3000)
});