require('dotenv').config();

//Inicializa la conexion a la base de datos

var admin = require("firebase-admin");

var serviceAccount = require(process.env.SERVICEACCOUNTPATH);

const firebaseApp=admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://geodependent.firebaseio.com'
  });

const db=admin.firestore();

//Esto creo que no hace nada
const dbConnection = async() => {

    try {
        console.log('BD conectada');
    } catch (error) {
        console.log(error);
        throw new Error('Error al iniciar la BD');
    }
}

module.exports = { dbConnection };