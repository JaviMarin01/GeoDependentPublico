const admin = require("firebase-admin");
const db=admin.firestore();

//Funcion que comprueba si hay usuarios sucritos y han cumplido el anyo de suscripcion para cambiarle el estado a no suscrito y borrarle sus grupos
async function comprobarSuscripciones() {

    let usuarios = await db.collection('usuarios').where('rol','==', 'ROL_CUIDADOR').get();

    usuarios = usuarios.docs.map(userDoc => {
        const userData = userDoc.data();
        userData.id=userDoc.id;
        return userData;
      });

    let fechaActual = new Date();

    
    usuarios = usuarios.filter(x=> x.suscripcion==true && (fechaActual.getTime() - x.fechaSuscripcion.toDate().getTime()) >= (365 * 24 * 60 * 60 * 1000));

    for(let i=0;i<usuarios.length;i++){

        let idsHorarios=[];

        await db.runTransaction(async (transaction) => {

            idsHorarios=[];

            let usu = {};
            usu.suscripcion=false;
            usu.fechaSuscripcion=new Date();

            //Borrar todos sus grupos
            
            const existeGrupo = await transaction.get(db.collection('grupos').where('uidUsuarios', 'array-contains', usuarios[i].id));

            if (!existeGrupo.empty) {
                
                for(let j=0;j<existeGrupo.docs.length;j++){
                    if(existeGrupo.docs[j].data().uidUsuarioCreador==usuarios[i].id){    //Borrar el grupo, las zonas y horarios de ese grupo
                        //Borrar las zonas que tenga asociadas
    
                        let zonas = await db.collection('zonas').where('uidGrupo', '==', existeGrupo.docs[j].id).get();
    
                        for(let n=0;n<zonas.docs.length;n++){

                            const horariosZona = await db.collection('horarios').where('uidZona', '==', zonas.docs[n].id).get();
                
                            for(let m=0;m<horariosZona.docs.length;m++){
                                        
                                transaction.delete(db.collection('horarios').doc(horariosZona.docs[m].id));
            
                                idsHorarios.push(horariosZona.docs[m].id);
                
                            }
                
                            transaction.delete(db.collection('zonas').doc(zonas.docs[n].id));
            
                        }
            
                        transaction.delete(db.collection('grupos').doc(existeGrupo.docs[j].id));
    
                    }else{
                        let uidUsuarios = existeGrupo.docs[j].data().uidUsuarios;
                        let notif = existeGrupo.docs[j].data().notificaciones;
                        let idx = existeGrupo.docs[j].data().uidUsuarios.indexOf(usuarios[i].id);
                        if(idx!=-1){
                            uidUsuarios.splice(idx, 1);
                            notificaciones.splice(idx, 1);
                        }

                        grupo = {
                            uidUsuarios: uidUsuarios,
                            notificaciones: notif
                        };

                        transaction.update(db.collection('grupos').doc(existeGrupo.docs[j].id), grupo);
                    }
                }
            }   

            transaction.update(db.collection('usuarios').doc(usuarios[i].id), usu);
            
        });

        const release = await global.mutex.acquire();

        for(let i=0;i<idsHorarios.length;i++){
            let horar=global.horariosProgramados.filter(x => { return x.id===idsHorarios[i]});
            for(let n=0;n<horar.length;n++){
                horar[n].prog.cancel();
            }
            global.horariosProgramados=global.horariosProgramados.filter(x => { return x.id!==idsHorarios[i]});
        }

        global.mutex.release(release);
    }

    
}

module.exports = { comprobarSuscripciones }