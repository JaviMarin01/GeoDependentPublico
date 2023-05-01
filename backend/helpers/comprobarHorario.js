const { enviarNotificacion } = require('../helpers/enviarNotificacion');
const { comprobarDentro } = require('../helpers/comprobarDentro');
const { crearNotificacion } = require('./crearNotificacion');
const { compararDiaSiguiente } = require('../helpers/compararDiaSiguiente');
const admin = require("firebase-admin");
const db=admin.firestore();

//Funcion que se ejecuta en las tareas programadas de node-schedule y contiene la logica de comprobacion para las notificaciones
async function comprobarHorario(id, esInicial) {
    console.log("id: ",id, ", inicial: ", esInicial);

    const existeHorario = await db.collection('horarios').doc(id).get();
    let usuarios = await db.collection('usuarios').get();

    usuarios = usuarios.docs.map(userDoc => {
        const userData = userDoc.data();
        userData.id=userDoc.id;
        return userData;
      });

    if(existeHorario.exists){

        const zona = await db.collection('zonas').doc(existeHorario.data().uidZona).get();

        if (!zona.exists) {
            return;
        }

        const grupo = await db.collection('grupos').doc(zona.data().uidGrupo).get();

        if (!grupo.exists) {
            return;
        }

        let usuariosDepen = [];
        for(let j=0;j<grupo.data().uidUsuarios.length;j++){
            let usuariosDepenAux = usuarios.find((x) => x.id==grupo.data().uidUsuarios[j] && x.rol=="ROL_DEPENDIENTE" && existeHorario.data().uidUsuarios.includes(x.id));
            if(usuariosDepenAux){
                usuariosDepen=usuariosDepen.concat(usuariosDepenAux);
            }
        }

        for(let i=0;i<usuariosDepen.length;i++){

            let cuerpoMensaje="";

            let estaDentro=comprobarDentro(usuariosDepen[i].posicion, zona.data().posicion, zona.data().radio);

            if(esInicial && !estaDentro){    //Tiene que estar dentro de la zona, sino mal
                cuerpoMensaje=usuariosDepen[i].nombre+" no está en "+zona.data().nombre+" en el inicio del horario";
            }else if(!esInicial && estaDentro){            //Tiene que estar fuera de la zona al final del horario
                cuerpoMensaje=usuariosDepen[i].nombre+" aún está en "+zona.data().nombre+" fuera del horario";
            }

            if(cuerpoMensaje!=""){
                let ususCuidad=[];
                let ususCuidadPush=[];
        
                for(let j=0;j<grupo.data().uidUsuarios.length;j++){
                    let usuariosCuidAux = usuarios.find((x) => x.id==grupo.data().uidUsuarios[j] && x.rol=="ROL_CUIDADOR");
                    if(usuariosCuidAux && grupo.data().notificaciones[j]){
                        if(usuariosCuidAux.suscripcion || (!usuariosCuidAux.suscripcion && compararDiaSiguiente(usuariosCuidAux.ultimaNotificacion))){
                            ususCuidad = ususCuidad.concat(usuariosCuidAux);
                            if(usuariosCuidAux.tokenDispositivo!=""){
                                ususCuidadPush = ususCuidadPush.concat(usuariosCuidAux);
                            }
                        }
                    }
                }

                for(let j=0;j<ususCuidad.length;j++){
                    crearNotificacion(cuerpoMensaje, ususCuidad[j].id);
                    const usu = usuarios.find(elemento => elemento.id === ususCuidad[j].id);
                    if (usu) {
                        usu.ultimaNotificacion = admin.firestore.Timestamp.fromDate(new Date());
                    }
                }

                let registrationTokens=[];
                for(let j=0;j<ususCuidadPush.length;j++){
                    registrationTokens.push(ususCuidadPush[j].tokenDispositivo);
                }

                if(registrationTokens.length>0){
                    let payload = {
                        notification: {
                            title: 'GeoDependent',
                            body: cuerpoMensaje
                        },
                        data: {
                            title: 'GeoDependent',
                            body: cuerpoMensaje
                        }
                    };

                    enviarNotificacion(payload, registrationTokens);
                }
            }
        }
    }else{
        const release = await global.mutex.acquire();

        let horar=global.horariosProgramados.filter(x => { return x.id===id});
        for(let i=0;i<horar.length;i++){
            horar[i].prog.cancel();
        }
        global.horariosProgramados=global.horariosProgramados.filter(x => { return x.id!==id});

        global.mutex.release(release);
    }
}

module.exports = { comprobarHorario }