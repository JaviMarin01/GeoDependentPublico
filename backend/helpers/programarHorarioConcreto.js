const { comprobarHorario } = require('../helpers/comprobarHorario');
const schedule = require('node-schedule');

//Funcion para generar el node schedule de un horario concreto y dejar las tareas programadas
function programarHorarioConcreto(horario){
    let dias=["D","L","M","X","J","V","S"];

    for(let i=0;i<horario.diasSemana.length;i++){
        let horaMin=Number(horario.horas[i].split(";")[0].split(":")[0]);
        let minutoMin=Number(horario.horas[i].split(";")[0].split(":")[1]);
        let horaMax=Number(horario.horas[i].split(";")[1].split(":")[0]);
        let minutoMax=Number(horario.horas[i].split(";")[1].split(":")[1]);

        let dia;
        let dia1;
        if(horario.diasSemana[i].includes(";")){
            dia=dias.indexOf(horario.diasSemana[i].split(";")[0]);
            dia1=dias.indexOf(horario.diasSemana[i].split(";")[1]);
        }else{
            dia=dias.indexOf(horario.diasSemana[i]);
            dia1=dias.indexOf(horario.diasSemana[i]);
        }

        /*horaMin=horaMin-Number(process.env.TIEMPO_SERVIDOR);
        if(horaMin<0){
            horaMin=24-Math.abs(horaMin);
            dia=dia-1;
            if(dia<0){
                dia=7-Math.abs(dia);
            }
        }*/

        const reglaInicial = new schedule.RecurrenceRule();
        reglaInicial.dayOfWeek = dia;
        reglaInicial.hour = horaMin;
        reglaInicial.minute = minutoMin;
        let horarioInicial=schedule.scheduleJob(reglaInicial, function () {
            comprobarHorario(horario.id, true);
        });
        let horIni={id:horario.id, fase:true, prog:horarioInicial};
        console.log({id:horario.id, fase:true});
        global.horariosProgramados.push(horIni);

        //Pasados 5 minutos de la hora final real
        const reglaFinal = new schedule.RecurrenceRule();

        minutoMax=minutoMax+5;
        if(minutoMax>=60){
            minutoMax=minutoMax-60;
            horaMax=horaMax+1;
            if(horaMax>23){
                horaMax=horaMax-24;
            }
        }

        //Como la hora del servidor de Render es una menos, necesito restarle 1 hora para que coincidan los eventos con mi hora
        //Es decir, a las 12 mias en el servidor son las 11, por lo que si le digo que ejecute a las 12 mias algo, en el servidor 
        //a las 12 seran mis 13 por lo que si quiero que a las 12 mias ejecute algo le tengo que restar 1 hora, de manera que a mis
        //12 se ejecute en el servidor a las 11 en vez de decirle a las 12
        /*horaMax=horaMax-Number(process.env.TIEMPO_SERVIDOR);
        if(horaMax<0){
            horaMax=24-Math.abs(horaMax);
            dia1=dia1-1;
            if(dia1<0){
                dia1=7-Math.abs(dia1);
            }
        }*/

        reglaFinal.dayOfWeek = dia1;
        reglaFinal.hour = horaMax;
        reglaFinal.minute = minutoMax;
        let horarioFinal=schedule.scheduleJob(reglaFinal, function () {
            comprobarHorario(horario.id, false);
        });

        let horFin={id:horario.id, fase:false, prog:horarioFinal};
        console.log({id:horario.id, fase:false});
        global.horariosProgramados.push(horFin);
    }
}

module.exports = { programarHorarioConcreto }
