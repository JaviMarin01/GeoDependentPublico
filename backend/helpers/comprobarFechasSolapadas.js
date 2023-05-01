

//Funcion que comprueba si en el array diasSemana junto con las horas, hay rangos de fechas y horas solapados
const comprobarFechasSolapadas = (diasSemana, horas) => {
    let dias=["D","L","M","X","J","V","S"];
    let fechas=[];

    for(let i=0;i<diasSemana.length;i++){                           //Convierte en fechas min y max cada una de las pasadas
        let horaMin=Number(horas[i].split(";")[0].split(":")[0]);
        let minutoMin=Number(horas[i].split(";")[0].split(":")[1]);
        let horaMax=Number(horas[i].split(";")[1].split(":")[0]);
        let minutoMax=Number(horas[i].split(";")[1].split(":")[1]);
        
        let idx;
        let idx1;
        if(diasSemana[i].includes(";")){
            idx=dias.indexOf(diasSemana[i].split(";")[0]);
            idx1=dias.indexOf(diasSemana[i].split(";")[1]);
        }else{
            idx=dias.indexOf(diasSemana[i]);
            idx1=dias.indexOf(diasSemana[i]);
        }
        
        let fechaActual=new Date();
        let fechaInicial=new Date();
        fechaInicial.setHours(Number(horaMin),Number(minutoMin), 0);
        let fechaFinal=new Date();
        fechaFinal.setHours(Number(horaMax),Number(minutoMax), 0);

        let distance1=0;
        let distance2=0;
        let dia1=idx;
        let dia2=idx1;
        let diaActual = fechaActual.getDay();

        if((dia1==dia2 && fechaInicial>fechaFinal) || dia1>dia2){
            distance1=dia1-diaActual;
            distance2=dia2-diaActual;
            fechaInicial.setDate(fechaActual.getDate() + distance1);
            fechaFinal.setDate(fechaActual.getDate() + distance2);

            let fechaIniIni=new Date();
            let dist=0-diaActual;
            fechaIniIni.setDate(fechaActual.getDate()+dist);
            fechaIniIni.setHours(0, 0, 0);

            fechas.push({fechaMin: fechaIniIni, fechaMax: fechaFinal});

            let fechaFinFin=new Date();
            let dist1=6-diaActual;
            fechaFinFin.setDate(fechaActual.getDate()+dist1+1);
            fechaFinFin.setHours(0, 0, 0);

            fechas.push({fechaMin: fechaInicial, fechaMax: fechaFinFin});
        }else{
            distance1=dia1-diaActual;
            distance2=dia2-diaActual;
            fechaInicial.setDate(fechaActual.getDate() + distance1);
            fechaFinal.setDate(fechaActual.getDate() + distance2);

            fechas.push({fechaMin: fechaInicial, fechaMax: fechaFinal});
        }
    }

    //Para cada horario, comprueba si esta solapando con otra de las pasadas
    let solapa=false;
    for(let i=0;i<fechas.length && !solapa;i++){
            for(let j=0;j<fechas.length  && !solapa;j++){
                if(i!=j && fechas[i].fechaMin.getTime() <= fechas[j].fechaMax.getTime() && fechas[j].fechaMin.getTime() <= fechas[i].fechaMax.getTime()){
                    solapa=true;
                }   
            }
    }
    return solapa;
}

module.exports = { comprobarFechasSolapadas }