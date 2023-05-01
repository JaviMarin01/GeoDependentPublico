
//Funcion que genera un codigo aleatorio para el grupo
const  generarCodigo = (num) => {
    const caracteres ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let res= '';
    for ( let i = 0; i < num; i++ ) {
        res += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return res;
}

module.exports = { generarCodigo }