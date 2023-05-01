const rolesPermitidos = ['ROL_DEPENDIENTE', 'ROL_CUIDADOR'];

//Funcion que valida el rol permitido
const validarRol = (req, res = response, next) => {
    const rol = req.body.rol;

    if (rol && !rolesPermitidos.includes(rol)) {
        return res.status(400).json({
            ok: false,
            msg: 'Argumentos vacios o de tipo incorrecto',
            codigo: 400013,
        });
    }
    next();
}

module.exports = { validarRol }