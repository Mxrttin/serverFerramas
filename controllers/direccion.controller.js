const db = require('../db'); 

const agregarDireccion = (req, res) => {
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
        console.log("Direccion agregada exitosamente");
        return res.status(200).json({success: true, message: "Direccion registrada exitosamente"});
    });

}

const modificarDireccion = (req,res) =>{
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
}

const direccionUsuario = (req, res) =>{
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
}



module.exports = {
    agregarDireccion,
    modificarDireccion,
    direccionUsuario

}