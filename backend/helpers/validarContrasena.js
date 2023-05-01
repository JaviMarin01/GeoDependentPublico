
//Funcion que valida el formato de la contrasenya (1 min, 1 may, 1 num, entre 8-32 caracteres)
const validarContrasena = (contrasena) => {
    let valida = true;

    if (contrasena.length < 8 || contrasena.length > 32 || !contrasena.match(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])/))
        valida = false;

    return valida;
}

module.exports = { validarContrasena }