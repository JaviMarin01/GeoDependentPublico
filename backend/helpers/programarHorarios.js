const { programarHorarioConcreto } = require('../helpers/programarHorarioConcreto');
const admin = require("firebase-admin");
const db=admin.firestore();

//Funcion para programar todos los horarios al arrancar el backend
async function programarHorarios(){
    let horariosTotales = await db.collection('horarios').get();

    horariosTotales = horariosTotales.docs.map(doc => {
        const data = doc.data();
        data.id=doc.id;
        return data;
    });

    for(let i=0;i<horariosTotales.length;i++){
        programarHorarioConcreto(horariosTotales[i]);
    }
}

module.exports = { programarHorarios }
