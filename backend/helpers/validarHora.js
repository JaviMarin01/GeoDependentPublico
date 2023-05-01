
//Funcion que valida el formato del array horas del horario (horaIni:minutoIni;horaFin:horaFin)
const validarHora = (hora) => {
    for(let i=0;i<hora.length;i++){
        if(!hora[i].includes(";") || hora[i].split(";").length!=2){
            return false;
        }
        let pattern=new RegExp("^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$");
        let result = pattern.test(hora[i].split(";")[0]);
        let result1 = pattern.test(hora[i].split(";")[1]);
        if(!result || !result1){
            return false;
        }
    }

    return true;
}

module.exports = { validarHora }