const { distanciaUsuarioCentroZona } = require('../helpers/distanciaUsuarioCentroZona');

//Funcion que comprueba si el usuario esta dentro de la zona o no
const comprobarDentro = (posicion, centro, radio) => {

    let dentro=false;
    let nuevoRadio = distanciaUsuarioCentroZona(posicion.split(";")[0], posicion.split(";")[1], centro.split(";")[0], centro.split(";")[1]);

    if( nuevoRadio < radio ) {
        dentro=true;
    }
    return dentro;

}

module.exports = { comprobarDentro }