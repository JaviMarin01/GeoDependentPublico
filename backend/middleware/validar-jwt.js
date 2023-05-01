const jwt = require('jsonwebtoken');

//Funcion que valida el JWT en cada una de las peticiones que requieran de este token
const validarJWT = async (req, res, next) => {

    const token = req.header('x-token') || req.query.token;

    if (!token) {
        return res.status(401).json({
            ok: false,
            msg: 'Falta token de autorización',
            codigo: 401000
        });
    }

    try {
        const { email, rol, ...object } = jwt.verify(token, process.env.JWTSECRET);

        if(!email || !rol){
            return res.status(401).json({
                ok: false,
                msg: 'Token no válido',
                codigo: 401001
            })
        }
        req.emailToken = email;
        req.rolToken = rol;

        next();
    } catch (err) {
        return res.status(401).json({
            ok: false,
            msg: 'Token no válido',
            codigo: 401001
        })
    }
}

module.exports = { validarJWT }