const admin = require("firebase-admin");

//Funcion que envia una notificacion a un numero de dispositivos moviles
const  enviarNotificacion = (payload, registrationTokens) => {
    if(registrationTokens.length>0){
        admin.messaging().sendToDevice(registrationTokens, payload, {priority: 'high'})
        .then(function(response) {
            console.log("Mensaje enviado:", response, " payload ", payload);
        })
        .catch(function(error) {
            console.log("Error enviando mensaje:", error, " payload ", payload);
        });
    }
}

module.exports = { enviarNotificacion }