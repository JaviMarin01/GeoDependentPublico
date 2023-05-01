
//Funcion que valida si es un array de strings o no
const validarArrayString = (array) => {
    if(!Array.isArray(array)){
        return false;
    }
    for(var i=0; i<array.length; i++){
        if(typeof array[i] != "string") {
            return false
        }
    }
    return true;
}

module.exports = { validarArrayString }