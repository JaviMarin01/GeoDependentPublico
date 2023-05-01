
//Funcion para saber si han pasado mas de 2 minutos desde la ultima actualizacion de posicion del usuario
const mas2min = (ultimaAct) => {

    let mas=false;

    let date=ultimaAct.toDate();

    let actual=new Date();
    let secs=Math.round((actual.getTime()-date.getTime())/1000);
    if(secs>2*60){
        mas=true;
        console.log("mas de 2 min");
    }
    
    return mas;

}

module.exports = { mas2min }
