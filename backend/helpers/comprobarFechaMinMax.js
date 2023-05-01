

//Funcion que comprueba el formato del conjunto diasSemana y horas
const comprobarFechaMinMax = (dia, horaMinMax) => {
    let dias=["D","L","M","X","J","V","S"];

    if(dia.includes(";")){
        let dia1=dias.indexOf(dia.split(";")[0]);
        let dia2=dias.indexOf(dia.split(";")[1]);

        let horaMin=Number(horaMinMax.split(";")[0].split(":")[0]);
        let minutoMin=Number(horaMinMax.split(";")[0].split(":")[1]);
        let horaMax=Number(horaMinMax.split(";")[1].split(":")[0]);
        let minutoMax=Number(horaMinMax.split(";")[1].split(":")[1]);

        if((minutoMin!=0 && minutoMin!=30) || (minutoMax!=0 && minutoMax!=30)){
            return false;
        }

        //Y habria que comentar esto si lo de arriba es verdad
        if(dia1==dia2 && (horaMin==horaMax && Math.abs(minutoMin-minutoMax)!=30)){
            return false;
        }
    }else{      //Comprobar que la fecha minima sea menor que la maxima y con diferencia de 30min
        let horaMin=Number(horaMinMax.split(";")[0].split(":")[0]);
        let minutoMin=Number(horaMinMax.split(";")[0].split(":")[1]);
        let horaMax=Number(horaMinMax.split(";")[1].split(":")[0]);
        let minutoMax=Number(horaMinMax.split(";")[1].split(":")[1]);

        if((minutoMin!=0 && minutoMin!=30) || (minutoMax!=0 && minutoMax!=30) || (horaMin==horaMax && Math.abs(minutoMin-minutoMax)!=30)){
            return false;
        }
    }
    return true;
}

module.exports = { comprobarFechaMinMax }