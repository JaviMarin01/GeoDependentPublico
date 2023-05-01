

//Funcion que comprueba si actualmente se esta en el horario entre todos sus rangos de dias y horas
const enHorario = (horario) => {
    let dentro=false;

    let diasSemana=["D", "L", "M", "X", "J", "V", "S"];
    let fechaActual=new Date();

    for(let i=0;i<horario.data().diasSemana.length && !dentro;i++){
        let idx;
        let idx1;
        if(horario.data().diasSemana[i].includes(";")){
            idx=diasSemana.indexOf(horario.data().diasSemana[i].split(";")[0]);
            idx1=diasSemana.indexOf(horario.data().diasSemana[i].split(";")[1]);
        }else{
            idx=diasSemana.indexOf(horario.data().diasSemana[i]);
            idx1=diasSemana.indexOf(horario.data().diasSemana[i]);
        }

        let fechaInicial=new Date();
        fechaInicial.setHours(Number(horario.data().horas[i].split(";")[0].split(":")[0]),Number(horario.data().horas[i].split(";")[0].split(":")[1]));
        let fechaFinal=new Date();
        fechaFinal.setHours(Number(horario.data().horas[i].split(";")[1].split(":")[0]),Number(horario.data().horas[i].split(";")[1].split(":")[1]));

        let distance1=0;
        let distance2=0;
        let dia1=idx;
        let dia2=idx1;
        let diaActual = fechaActual.getDay();

        let excepcion=false;

        if(dia1!=dia2){ 
            if(dia1<dia2){//Si el dia inicial es menor que el final, unicamente restamos el dia actual
                distance1=dia1-diaActual;
                distance2=dia2-diaActual;
            }else if(dia1>dia2 && diaActual<dia1){//Si el dia inicial es mayor que el final y el dia actual es menor al dia inicial, significa que la hora inicial empieza la semana anterior y acaba en esta
                distance1=dia1-diaActual-7;
                distance2=dia2-diaActual;
            }else if(dia1>dia2 && diaActual>=dia1){//Si el dia inicial es mayor que el final y el dia actual es mayor o igual al inicial, significa que la hora inicial empieza en la misma semana y es hasta la siguiente
                distance1=dia1-diaActual;
                distance2=dia2-diaActual+7;
            }
        }else{
            if(fechaInicial<fechaFinal){//Horario del mismo dia tipo L;L de 12h a 15h
                distance1=dia1-diaActual;
                distance2=dia2-diaActual;
            }else if(fechaInicial>fechaFinal && diaActual>dia1){//Horario del mismo dia al mismo dia, pero con la hora inicial mayor que la final y siendo el dia actual mayor que el dia de la hora (coge el dia de la hora y lo alarga hasta el mismo dia de la semana siguiente)
                distance1=dia1-diaActual;
                distance2=dia2-diaActual+7;
            }else if(fechaInicial>fechaFinal && diaActual<dia1){//Horario del mismo dia al mismo dia, pero con la hora inicial mayor que la final y siendo el dia actual menor que el dia de la hora (coge el dia de la hora empezando en la semana anterior y lo alarga hasta el mismo dia de esta semana)
                distance1=dia1-diaActual-7;
                distance2=dia2-diaActual;
            }else if(fechaInicial>fechaFinal && diaActual==dia1){//Horario del mismo dia al mismo dia, pero con la hora inicial mayor que la final y siendo el dia actual el mismo que el de la hora (coge la hora del mismo dia para la inicial y final y luego la comprobacion es si la fecha actual es menor que la hora final o mayor que la inicial, significa que esta en horario)
                excepcion=true;
                distance1=dia1-diaActual;
                distance2=dia2-diaActual;
            }
        }

        fechaInicial.setDate(fechaActual.getDate() + distance1);

        fechaFinal.setDate(fechaActual.getDate() + distance2);

        if(excepcion && (fechaActual>=fechaInicial || fechaActual<=fechaFinal)){//En el caso en que la hora final y inicial es el mismo dia y es de una semana a otra, entonces solo esta dentro si la actual es mayor que la inicial en adelante o es menor que la final, porque la inicial es mayor que la final y entonces entre ambas es cuando no esta dentro
            dentro=true;
        }else if(fechaInicial <= fechaActual && fechaFinal >= fechaActual){
            dentro=true;
        }
      
    }
    return dentro;

}

module.exports = { enHorario }