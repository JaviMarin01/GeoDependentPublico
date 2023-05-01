const jwt = require('jsonwebtoken');

//Funcion que obtiene la informacion del token (email y rol)
const infoToken = (token) => {
    return jwt.verify(token, process.env.JWTSECRET);
}
module.exports = { infoToken }