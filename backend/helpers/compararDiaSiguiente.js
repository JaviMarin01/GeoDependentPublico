//Funcion que comprueba si la fecha actual es de un dia distinto al pasado por parametro
const compararDiaSiguiente = (fecha) => {

    let siguiente=false;

    fecha=fecha.toDate();
    console.log("fecha:",fecha);
    
    let hoy=new Date();
    console.log("hoy",hoy);

    if(hoy.getFullYear() > fecha.getFullYear() || (hoy.getFullYear() === fecha.getFullYear() && hoy.getMonth() > fecha.getMonth()) || (hoy.getFullYear() === fecha.getFullYear() && hoy.getMonth() === fecha.getMonth() && hoy.getDate() > fecha.getDate())){
        siguiente=true;
    }
    
    return siguiente;

}

module.exports = { compararDiaSiguiente }