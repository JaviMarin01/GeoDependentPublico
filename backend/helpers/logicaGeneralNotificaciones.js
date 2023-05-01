const { enviarNotificacion } = require('../helpers/enviarNotificacion');
const { enHorario } = require('../helpers/enHorario');
const { comprobarDentro } = require('../helpers/comprobarDentro');
const { crearNotificacion } = require('./crearNotificacion');
const { compararDiaSiguiente } = require('../helpers/compararDiaSiguiente');
const admin = require("firebase-admin");
const { mas2min } = require('./mas2min');
const db=admin.firestore();

async function logicaGeneral(){

    console.log("Logica General");

    let usuarios = await db.collection('usuarios').get();

    usuarios = usuarios.docs.map(userDoc => {
        const userData = userDoc.data();
        userData.id=userDoc.id;
        return userData;
      });

    let usuariosDependientes=usuarios.filter(x => { return x.rol==="ROL_DEPENDIENTE"});

    const grupos = await db.collection('grupos').get();
    const zonas = await db.collection('zonas').get();
    const horarios = await db.collection('horarios').get();

    //Para cada usuario dependiente, saco sus zonas y horarios. Para cada zona de este usuario
    //compruebo si esta dentro o fuera de la zona, y si tiene horarios asociados en esa zona, 
    //miro si esta dentro de alguno de los horarios. Y si esta dentro de alguno de sus horarios
    //entonces envio que esta dentro o fuera en cada uno de los horarios que estan pasando en este momento
    for(let i=0;i<usuariosDependientes.length;i++){

        let gruposUsu=grupos.docs.filter((x) => x.data().uidUsuarios.includes(usuariosDependientes[i].id));

        let zonasUsu=[];
        for(let p=0;p<gruposUsu.length;p++){
            let zonasAux = zonas.docs.filter((x) => x.data().uidGrupo==gruposUsu[p].id);
            zonasUsu = zonasUsu.concat(zonasAux);
        }

        let horariosUsu=[];
        for(let s=0;s<zonasUsu.length;s++){
            let horariosAux = horarios.docs.filter((x) => x.data().uidZona==zonasUsu[s].id && x.data().uidUsuarios.includes(usuariosDependientes[i].id));
            horariosUsu = horariosUsu.concat(horariosAux);
        }

        let cuerpoMensaje="";

        let estaEnAlgunHorario=[];

        let ultAct=mas2min(usuariosDependientes[i].ultimaActPosicion);

        //Si la ultimaActualizacion es mayor de 2 minutos, significa que el usuario ha dejado de actualizar su posicion
        if(ultAct){
            for(let m=0;m<horariosUsu.length;m++){
                let dentroHorario=enHorario(horariosUsu[m]);
                if(dentroHorario){
                    estaEnAlgunHorario.push(m);
                }
            }
            for(let o=0;o<estaEnAlgunHorario.length;o++){
                cuerpoMensaje="";
                let zonaHorario=zonasUsu.find(x => { return x.id===horariosUsu[estaEnAlgunHorario[o]].data().uidZona});
                if(zonaHorario){
                    let grupoHorario=gruposUsu.find(x => { return x.id===zonaHorario.data().uidGrupo});
                    if(grupoHorario){
    
                        cuerpoMensaje=usuariosDependientes[i].nombre+" no esta dando su ubicación estando en horario de "+zonaHorario.data().nombre;

                        let ususCuidad=[];
                        let ususCuidadPush=[];

                        for(let j=0;j<grupoHorario.data().uidUsuarios.length;j++){
                            let usuariosCuidAux = usuarios.find((x) => x.id==grupoHorario.data().uidUsuarios[j] && x.rol=="ROL_CUIDADOR");
                            if(usuariosCuidAux && grupoHorario.data().notificaciones[j]){
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
            }

        //En el caso de haber recibido senal hace menos de 2 minutos, entonces
        //comprobar si esta dentro de alguno de los horarios de ese usuario
        //Si es asi, entonces notificar si el usuario esta fuera de la zona estando
        //en el horario o esta dentro fuera del horario, ya que no es lo normal    
        }else{
            for(let p=0;p<horariosUsu.length;p++){

                let cuerpoMensaje="";

                let dentroHorario=enHorario(horariosUsu[p]);

                let zona=zonasUsu.find(x => { return x.id===horariosUsu[p].data().uidZona});
                if(zona){
                    let grupoHorario=gruposUsu.find(x => { return x.id===zona.data().uidGrupo});
                    if(grupoHorario){

                       
                        let estaDentro=false;
                        if(usuariosDependientes[i].posicion!=""){
                            estaDentro=comprobarDentro(usuariosDependientes[i].posicion, zona.data().posicion, zona.data().radio);
                        }
        
                        //Si el usuario esta dentro del horario y esta fuera de la zona notifica
                        if(dentroHorario && !estaDentro){
                            cuerpoMensaje=usuariosDependientes[i].nombre+" esta fuera de "+zona.data().nombre+" en el horario";
                        }

                        if(cuerpoMensaje!=""){
                            let ususCuidad=[];
                            let ususCuidadPush=[];

                            for(let j=0;j<grupoHorario.data().uidUsuarios.length;j++){
                                let usuariosCuidAux = usuarios.find((x) => x.id==grupoHorario.data().uidUsuarios[j] && x.rol=="ROL_CUIDADOR");
                                if(usuariosCuidAux && grupoHorario.data().notificaciones[j]){
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
                }
            }
        }
    }
}

module.exports = { logicaGeneral }
