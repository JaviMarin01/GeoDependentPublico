const express = require('express');
const cors = require('cors');

const fs = require("fs");

global.horariosProgramados=[];

const AsyncMutex = require('async-mutex').Mutex;

global.mutex = new AsyncMutex();

const https = require("https");

const options = {
    key: fs.readFileSync("./config/cert.key"),
    cert: fs.readFileSync("./config/cert.crt"),
};

// Crear una aplicación de express
const app = express();

const { dbConnection } = require('./database/configdb');

app.use(express.json());
app.use(cors());

dbConnection();

// Abrir la aplicacíon en el puerto 3000
app.listen(3000, () => {
    console.log('Servidor corriendo en el puerto ' + 3000);
});

/*https.createServer(options, app).listen(8080, () => {
    console.log(`HTTPS server started on port 8080`);
});*/


app.use('/api/usuario', require('./routes/usuario'));

app.use('/api/login', require('./routes/auth'));

app.use('/api/grupo', require('./routes/grupo'));

app.use('/api/zona', require('./routes/zona'));

app.use('/api/horario', require('./routes/horario'));

app.use('/api/notificacion', require('./routes/notificacion'));

app.get('/api/activo', (req, res) => {
    console.log("activo");
    res.send('Activo');
});


//LOGICA GENERAL DE NOTIFICACIONES CADA 5 MIN, PROGRAMAR HORARIOS YA CREADOS AL ARRANCAR BACKEND, Y PROGRAMAR COMPROBACION DE SUSCRIPCIONES CADA DIA
const schedule = require('node-schedule');

//Logica de comprobacion general cada X minutos
const { logicaGeneral } = require('./helpers/logicaGeneralNotificaciones');
setInterval(()=>{
    logicaGeneral()
    //console.log("5 min");
}, 5*60*1000);


//Programar los horarios ya creados al arrancar el backend
const admin = require('firebase-admin');
const db = admin.firestore();
const { programarHorarios } = require('./helpers/programarHorarios');

setTimeout(async ()=>{
    let a=await db.collection('programacion').doc('1').get();
    const data = a.data();
    if (data.programado === false) {
        console.log("Programar horarios");
        await db.collection('programacion').doc('1').update({programado: true});
        programarHorarios();
    } else {
        console.log('El valor de horarios es true, no se actualizó');
    }
}, 5000);

setTimeout(async ()=>{
    console.log("Poner a false el horario");
    await db.collection('programacion').doc('1').update({programado: false});
}, 30*60*1000);

//Todos los dias a las 00:00 se comprueba si se ha acabado la suscripcion de los cuidadores o no, para quitarle sus grupos y tal
const { comprobarSuscripciones } = require('./helpers/comprobarSuscripciones');

setTimeout(async ()=>{
    let a=await db.collection('programacion').doc('2').get();
    const data = a.data();
    if (data.suscripcion === false) {
        console.log("Programar suscripcion");
        await db.collection('programacion').doc('2').update({suscripcion: true});
        const reglaSusc = new schedule.RecurrenceRule();
        reglaSusc.hour = 0;
        reglaSusc.minute = 0;
        schedule.scheduleJob(reglaSusc, function () {
            console.log("Comprobar suscripciones");
            comprobarSuscripciones();
        });
    } else {
        console.log('El valor de suscripcion es true, no se actualizó');
    }
}, 10000);

setTimeout(async ()=>{
    console.log("Poner a false la suscripcion");
    await db.collection('programacion').doc('2').update({suscripcion: false});
}, 30*60*1000);