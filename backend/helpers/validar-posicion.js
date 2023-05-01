
//Funcion que valida el formato de la posicion (lon;lat)
const validarPosicion = (posicion) => {
    if(!posicion.includes(";") || (posicion.includes(";") && posicion.split(";").length!=2)){
        return false;
    }
    let pos1=posicion.split(";")[0];
    let pos2=posicion.split(";")[1];

    let reg=new RegExp("^\\-?\\d+(\\.\\d+)?$");
    if(!reg.test(pos1)){
        return false;
    }
    if(!reg.test(pos2)){
        return false;
    }
    return true;
}

module.exports = { validarPosicion }