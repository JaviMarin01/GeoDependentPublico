const jwt = require('jsonwebtoken');

//Funcion que genera un nuevo JWT
const generarJWT = (email, rol) => {

    return new Promise((resolve, reject) => {

        const payload = {
            email,
            rol
        }

        jwt.sign(payload, process.env.JWTSECRET, {
            expiresIn: '1y'
        }, (err, token) => {
            if (err) {
                console.log(err);
                reject('No se pudo generar el JWT');
            } else {
                resolve(token);
            }
        });

    });
}

module.exports = { generarJWT }