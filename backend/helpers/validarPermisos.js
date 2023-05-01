//Funcion que valida si el usuario tiene permisos para realizar la peticion
const { infoToken } = require('../helpers/infoToken');

const validarPermisos = (token, roles) => {
    return !roles.includes(infoToken(token).rol);
}

module.exports = { validarPermisos }