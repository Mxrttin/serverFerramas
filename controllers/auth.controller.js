const db = require('../db');
const bcrypt = require('bcrypt');
const { response } = require('express');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_aqui';

exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    console.log("Intento de login:", email);  
    
    const sql = "SELECT * FROM usuarios WHERE correo = ?";
    
    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error("Error en la consulta SQL:", err);
            return res.status(500).json({ error: "Error del servidor" });
        }

        if (results.length > 0) {
            const usuario = results[0];

            const match = await bcrypt.compare(password, usuario.clave);
            if (!match) return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
            
            const payload = {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo,
                telefono: usuario.telefono,
                rut: usuario.rut,
                rol: usuario.rol
            };

            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

            console.log(`Usuario conectado: ${usuario.correo}`)

            res.json({ success: true, token });
            
        } else {
            res.status(401).json({ success: false, message: "Correo no encontrado" });
        }
    });
};

exports.registrarUsuario = async (req, res) => {
  const { rut, nombre,apellido, correo, telefono, clave } = req.body;

  const verificarCorreo = async(correo) =>{
    return new Promise((resolve, reject) =>{
      const sql = `SELECT * FROM usuarios WHERE correo = ?`;
      db.query(sql, [correo], (err, result) =>{
        if(err) return reject(err);
        resolve(result.length > 0)
      })
    })

  }

  const verificarRut = async (req,res) =>{
    return new Promise((resolve, reject) =>{
      const sql = `SELECT * FROM usuarios WHERE rut = ?`;
      db.query(sql, [rut], (err, result) =>{
        if(err) return reject(err);
        resolve(result.length > 0)
      })
    })
  }

  try {

    const existeCorreo = await verificarCorreo(correo)
    const existeRut = await verificarRut(rut)

    if(existeRut){
      return res.status(400).json({ success: false, message: "El rut ya está registrado" });
    }

    if(existeCorreo){
      return res.status(400).json({ success: false, message: "El correo ya está registrado" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(clave, salt);

    const sql = `
      INSERT INTO usuarios (rut, nombre,apellido, correo, telefono, clave, rol)
      VALUES (?, ?, ?, ?, ?,?, 2)
    `;

    db.query(sql, [rut, nombre,apellido, correo, telefono, hashedPassword], (err, result) => {
      if (err) {
        console.error("Error en la consulta SQL:", err);
        return res.status(500).json({ success: false, message: "Error al registrar usuario" });
      }
      return res.status(200).json({ success: true, message: "Usuario registrado exitosamente" });
    });
  } catch (err) {
    console.error("Error en servidor:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
