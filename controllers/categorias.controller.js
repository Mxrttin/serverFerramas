const db = require('../db'); 

const categorias = (req, res) =>{
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

}

const categoriaID = (req, res) => {

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

        res.json({
            success: true,
            productos: results  
        });
    });
}

module.exports = {
  categorias,
  categoriaID
};

