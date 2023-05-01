const admin = require('firebase-admin');
const db = admin.firestore();

//Funcion que crea la notificacion en la base de datos para el usuario y le actualiza la fecha de la ultima notificacion
async function crearNotificacion(texto, uidUsuario){

    let notificacionNuevo = {
        texto: texto,
        uidUsuario: uidUsuario,
        fecha: new Date(),
        leido: false
    };

    await db.collection('notificaciones').add(notificacionNuevo);

    let obj={};
    obj.ultimaNotificacion=new Date();

    await db.collection('usuarios').doc(uidUsuario).update(obj);
}

module.exports = { crearNotificacion }
