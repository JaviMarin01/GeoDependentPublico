const { response } = require('express');
const { validarPermisos } = require('../helpers/validarPermisos');
const { infoToken } = require('../helpers/infoToken');
const { generarCodigo } = require('../helpers/generarCodigo');
const { validarArrayString } = require('../helpers/validar-array-string');
const admin = require("firebase-admin");
const db=admin.firestore();


const obtenerGrupos = async(req, res) => {
    let id = req.query.id;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);
    
    try {

        let grupos = [];
        if(id){       //Si se le pasa un id de un grupo, busca el grupo de ese id y luego se comprueba el que coincida con alguno de los suyos

            let grupo = await db.collection('grupos').doc(id).get();

            if(grupo.exists && (grupo.data().uidUsuarioCreador==informacionToken.email || grupo.data().uidUsuarios.includes(informacionToken.email))){
                const data = grupo.data();
                const grupoConId = { id: grupo.id, ...data };
                grupos=grupos.concat(grupoConId);
            }

        }else{

            let grs = await db.collection('grupos').where('uidUsuarios','array-contains', informacionToken.email).get();
            let gr = grs.docs.map((doc) => {
                const data = doc.data();
                const id = doc.id;
                return { id, ...data };
              });
            grupos=grupos.concat(gr);
            
        }

        res.json({
            ok: true,
            msg: 'obtenerGrupos',
            codigo: 200002,
            grupos
        });

    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            msg: 'Error obteniendo grupos',
            codigo: 400007
        });
    }
}


const crearGrupo = async(req, res = response) => {

    let { nombre, ...object } = req.body;

    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    if (validarPermisos(token, ['ROL_CUIDADOR'])) {
        // Solo pueden crear grupos los cuidadores
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para crear grupos',
            codigo: 401004
        });
    }

    try {
        let grupoNuevo = {};
        let id="";

        //Si algo falla, se deshacen los cambios (en el caso de comprobar si un usuario crea un grupo, si entran 2 peticiones simultaneas, se hace una y despues la otra, para no dar fallos)
        await db.runTransaction(async (transaction) => {
            // Comprobamos si ya existe un usuario con el correo electrónico proporcionado
            const usuarioBD = await transaction.get(db.collection('usuarios').doc(informacionToken.email));
        
            if (!usuarioBD.exists) {
                return res.status(401).json({
                    ok: false,
                    msg: 'El usuario no existe',
                    codigo: 401002
                });
            }

            //Generamos la fecha actual
            const fechaCreacion = new Date();

            //Generamos el codigo aleatorio para el grupo
            const codigo = generarCodigo(15);

            grupoNuevo = {
                nombre: nombre,
                fechaCreacion: fechaCreacion,
                uidUsuarioCreador: informacionToken.email,
                codigo: codigo,
                uidUsuarios: [informacionToken.email],
                notificaciones: [true]
            };

            let grupo=db.collection('grupos').doc();
            id=grupo.id;
            
            if(!usuarioBD.data().suscripcion){      //Si no esta suscrito, solo puede tener un grupo como maximo

                const grupos = await transaction.get(db.collection('grupos').where('uidUsuarios', 'array-contains', informacionToken.email));

                if(!grupos.empty){
                    return res.status(401).json({
                        ok: false,
                        msg: 'Solo puedes tener un grupo como máximo si no estás suscrito',
                        codigo: 401015
                    });
                }

            }

            transaction.set(db.collection('grupos').doc(grupo.id), grupoNuevo);

        });

        grupoNuevo.id=id;

        if(res.headersSent) return;

        res.json({
            ok: true,
            msg: 'crearGrupo',
            codigo: 201003,
            grupo: grupoNuevo
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error creando grupo',
            codigo: 400004
        });
    }
}


const actualizarGrupo = async(req, res) => {

    const { nombre, uidUsuariosAntes, uidUsuariosAhora, ...object } = req.body;
    const uid = req.params.id;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    if (validarPermisos(token, ['ROL_CUIDADOR'])) {
        // Solo pueden borrar usuarios los cuidadores
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para actualizar grupos',
            codigo: 401004
        });
    }

    try {
        if(!validarArrayString(uidUsuariosAntes)){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }
        let duplicados = uidUsuariosAntes => uidUsuariosAntes.filter((item, index) => uidUsuariosAntes.indexOf(item) != index);
        if(duplicados(uidUsuariosAntes).length>0){
            return res.status(400).json({
                ok: false,
                msg: 'No puedes introducir valores iguales',
                codigo: 400011,
            });
        }

        if(!validarArrayString(uidUsuariosAhora)){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }
        let duplicadosAhora = uidUsuariosAhora => uidUsuariosAhora.filter((item, index) => uidUsuariosAhora.indexOf(item) != index);
        if(duplicadosAhora(uidUsuariosAhora).length>0){
            return res.status(400).json({
                ok: false,
                msg: 'No puedes introducir valores iguales',
                codigo: 400011,
            });
        }

        if(uidUsuariosAhora.length>uidUsuariosAntes.length){
            return res.status(401).json({
                ok: false,
                msg: 'Solo puedes quitar a los usuarios del grupo',
                codigo: 401023
            });
        }

        //Comprueba que el array de usuarios ahora tenga todos sus valores en el de antes (es decir, no puedo anyadir usuarios, como mucho igualar los que habia o quitar)
        const todosPresentes = uidUsuariosAhora.every(valor => uidUsuariosAntes.includes(valor));

        if(!todosPresentes){
            return res.status(400).json({
                ok: false,
                msg: 'Los usuarios nuevos deben ser iguales a los que había antes',
                codigo: 400015,
            });
        }

        let grupo = {};

        //Si algo falla, se deshacen los cambios (en el caso de comprobar si un usuario crea un grupo, si entran 2 peticiones simultaneas, se hace una y despues la otra, para no dar fallos)
        await db.runTransaction(async (transaction) => {

            const existeGrupo = await transaction.get(db.collection('grupos').doc(uid));

            if (!existeGrupo.exists) {
                return res.status(401).json({
                    ok: false,
                    msg: 'El grupo no existe',
                    codigo: 401007
                });
            }

            if(existeGrupo.data().uidUsuarioCreador!=informacionToken.email){
                return res.status(401).json({
                    ok: false,
                    msg: 'No puedes actualizar un grupo que no es tuyo',
                    codigo: 401011
                });
            }

            if(!uidUsuariosAhora.includes(informacionToken.email) || !uidUsuariosAntes.includes(informacionToken.email)){
                return res.status(401).json({
                    ok: false,
                    msg: 'El creador del grupo siempre debe estar',
                    codigo: 401028
                });
            }
    
            let uidUsuarios = existeGrupo.data().uidUsuarios;

            if(uidUsuarios.length !== uidUsuariosAntes.length || !uidUsuarios.every((valor) => uidUsuariosAntes.includes(valor))){
                return res.status(401).json({
                    ok: false,
                    msg: 'El usuario no pertenece al grupo',
                    codigo: 401012
                });
            }
    
            if(!uidUsuariosAhora.every(uid => uidUsuarios.includes(uid))){
                return res.status(401).json({
                    ok: false,
                    msg: 'El usuario no pertenece al grupo',
                    codigo: 401012
                });
            }

            let notif=existeGrupo.data().notificaciones;
            let notifNueva=[];

            //Actualizamos el array de notificaciones en funcion de los uidUsuariosAhora, para que sigan teniendo el mismo valor cada usuario
            for(let i=0;i<uidUsuariosAhora.length;i++){
                let pos=uidUsuarios.indexOf(uidUsuariosAhora[i]);
                if(pos!=-1){
                    notifNueva.push(notif[pos]);
                }
            }
    
            grupo = {
                nombre: nombre,
                uidUsuarios: uidUsuariosAhora,
                notificaciones: notifNueva
            };

            transaction.update(db.collection('grupos').doc(uid), grupo);
        });

        if(res.headersSent) return;

        res.json({
            ok: true,
            msg: 'actualizarGrupo',
            codigo: 201004,
            grupo: grupo
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error actualizando grupo',
            codigo: 400005
        });
    }

}

const unirseGrupo = async(req, res) => {

    const { codigo, ...object } = req.body;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    if (validarPermisos(token, ['ROL_DEPENDIENTE', 'ROL_CUIDADOR'])) {
        // Solo pueden unirse los cuidadores y dependientes
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para unirse a un grupo',
            codigo: 401004

        });
    }

    try {

        let usuarioEnGrupoNuevo = {};

        //Si algo falla, se deshacen los cambios (en el caso de comprobar si un usuario crea un grupo, si entran 2 peticiones simultaneas, se hace una y despues la otra, para no dar fallos)
        await db.runTransaction(async (transaction) => {

            const grupoUnir = await transaction.get(db.collection('grupos').where('codigo', '==', codigo));

            if (grupoUnir.empty) {
                return res.status(401).json({
                    ok: false,
                    msg: 'El grupo no existe',
                    codigo: 401007
                });
            }

            if(grupoUnir.docs[0].data().uidUsuarioCreador == informacionToken.email || grupoUnir.docs[0].data().uidUsuarios.includes(informacionToken.email)){
                return res.status(401).json({
                    ok: false,
                    msg: 'El usuario ya se ha unido',
                    codigo: 401006
                });
            }

            const usuarioBD = await transaction.get(db.collection('usuarios').doc(informacionToken.email));
        
            if (!usuarioBD.exists) {
                return res.status(401).json({
                    ok: false,
                    msg: 'El usuario no existe',
                    codigo: 401002
                });
            }

            const usuarioCreadorBD = await transaction.get(db.collection('usuarios').doc(grupoUnir.docs[0].data().uidUsuarioCreador));
        
            if (!usuarioCreadorBD.exists) {
                return res.status(401).json({
                    ok: false,
                    msg: 'El usuario no existe',
                    codigo: 401002
                });
            }

            let uidUsuarios = grupoUnir.docs[0].data().uidUsuarios;
            let notif = grupoUnir.docs[0].data().notificaciones;
            uidUsuarios.push(informacionToken.email);
            notif.push(true);

            grupo = {
                uidUsuarios: uidUsuarios,
                notificaciones: notif
            };

            
            if(informacionToken.rol=="ROL_CUIDADOR" && !usuarioBD.data().suscripcion){
                const grupos = await transaction.get(db.collection('grupos').where('uidUsuarios', 'array-contains', informacionToken.email));

                if(!grupos.empty){      //Si no esta suscrito, solo puede tener un grupo como maximo
                    return res.status(401).json({
                        ok: false,
                        msg: 'Solo puedes tener un grupo como máximo si no estás suscrito',
                        codigo: 401015
                    });
                }
            }

            if(!usuarioCreadorBD.data().suscripcion && grupoUnir.docs[0].data().uidUsuarios.length>=2){
                return res.status(401).json({
                    ok: false,
                    msg: 'Solo pueden haber 2 personas máximo en un grupo si el creador no está suscrito',
                    codigo: 401016
                });
            }
            

            transaction.update(db.collection('grupos').doc(grupoUnir.docs[0].id), grupo);
        });

        if(res.headersSent) return;

        res.json({
            ok: true,
            msg: 'usuarioUnido',
            codigo: 201005,
            usuarioEnGrupo: usuarioEnGrupoNuevo
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error actualizando grupo',
            codigo: 400004
        });
    }

}

const recibirNotificaciones = async(req, res) => {

    const {notificacion, uidGrupo, ...object } = req.body;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    // Solo pueden modificar el grupo los cuidadores
    if (validarPermisos(token, ['ROL_CUIDADOR'])) {
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para activar/desactivar notificaciones de un grupo',
            codigo: 401004
        });
    }

    try {
        let recibir = {};

        //Si algo falla, se deshacen los cambios (en el caso de comprobar si un usuario crea un grupo, si entran 2 peticiones simultaneas, se hace una y despues la otra, para no dar fallos)
        await db.runTransaction(async (transaction) => {

            const existeGrupo = await transaction.get(db.collection('grupos').doc(uidGrupo));

            if (!existeGrupo.exists) {
                return res.status(401).json({
                    ok: false,
                    msg: 'El grupo no existe',
                    codigo: 401007
                });
            }

            if(existeGrupo.data().uidUsuarioCreador != informacionToken.email && !existeGrupo.data().uidUsuarios.includes(informacionToken.email)){
                return res.status(401).json({
                    ok: false,
                    msg: 'No te pertenece el grupo',
                    codigo: 401012
                });
            }

            let notif = existeGrupo.data().notificaciones;
            let idx = existeGrupo.data().uidUsuarios.indexOf(informacionToken.email);
            if(idx!=-1){
                notif[idx]=notificacion;
            }

            recibir = {
                notificaciones: notif
            };

            transaction.update(db.collection('grupos').doc(existeGrupo.id), recibir);

        });

        if(res.headersSent) return;

        recibir.id=uidGrupo;

        res.json({
            ok: true,
            msg: 'recibirNotificaciones',
            codigo: 201014,
            usuarioEnGrupo: recibir
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error actualizando usuarioEnGrupo',
            codigo: 400005
        });
    }

}

const salirGrupo = async(req, res) => {

    const { uidGrupo, ...object } = req.body;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    if (validarPermisos(token, ['ROL_DEPENDIENTE', 'ROL_CUIDADOR'])) {
        // Solo pueden salirse los cuidadores y dependientes
        return res.status(403).json({
            ok: false,
            msg: 'No tiene permisos para salir de un grupo',
            codigo: 401004
        });
    }

    try {

        let idsHorarios=[];

        //Si algo falla, se deshacen los cambios (en el caso de comprobar si un usuario crea un grupo, si entran 2 peticiones simultaneas, se hace una y despues la otra, para no dar fallos)
        await db.runTransaction(async (transaction) => {

            idsHorarios = [];

            const existeGrupo = await transaction.get(db.collection('grupos').doc(uidGrupo));

            if (!existeGrupo.exists) {
                return res.status(401).json({
                    ok: false,
                    msg: 'El grupo no existe',
                    codigo: 401007
                });
            }

            if(existeGrupo.data().uidUsuarioCreador != informacionToken.email && !existeGrupo.data().uidUsuarios.includes(informacionToken.email)){
                return res.status(401).json({
                    ok: false,
                    msg: 'No te pertenece el grupo',
                    codigo: 401012
                });
            }

            if(existeGrupo.data().uidUsuarioCreador==informacionToken.email){
                return res.status(401).json({
                    ok: false,
                    msg: 'No te puedes salir del grupo siendo creador',
                    codigo: 401024
                });
            }

            if(informacionToken.rol=="ROL_DEPENDIENTE"){

                const zonas = await transaction.get(db.collection('zonas').where('uidGrupo', '==', uidGrupo));

                let hor=[];
    
                for(let i=0;i<zonas.docs.length;i++){
                    const horarios = await transaction.get(db.collection('horarios').where('uidUsuarios', 'array-contains', informacionToken.email).where('uidZona', '==', zonas.docs[i].id));
                    for(let j=0;j<horarios.docs.length;j++){
                        hor.push(horarios.docs[j]);
                    }
                }
                for(let j=0;j<hor.length;j++){

                    let uids=hor[j].data().uidUsuarios;
                    var index = uids.indexOf(informacionToken.email);
                    if (index !== -1) {
                        uids.splice(index, 1);
                    }
                    if(uids.length==0){

                        transaction.delete(db.collection('horarios').doc(hor[j].id));

                        idsHorarios.push(hor[j].id);

                    }else{
                        let obj={};
                        obj.uidUsuarios=uids;

                        transaction.update(db.collection('horarios').doc(hor[j].id), obj);
                    }
                }
            }

            let uidUsuarios = existeGrupo.data().uidUsuarios;
            let notif = existeGrupo.data().notificaciones;
            let idx = existeGrupo.data().uidUsuarios.indexOf(informacionToken.email);
            if(idx!=-1){
                uidUsuarios.splice(idx, 1);
                notif.splice(idx, 1);
            }

            grupo = {
                uidUsuarios: uidUsuarios,
                notificaciones: notif
            };

            transaction.update(db.collection('grupos').doc(existeGrupo.id), grupo);
        });

        if(res.headersSent) return;

        const release = await global.mutex.acquire();

        //Si todo ha ido bien, borramos los horarios programados
        for(let i=0;i<idsHorarios.length;i++){
            let horar=global.horariosProgramados.filter(x => { return x.id===idsHorarios[i]});
            for(let j=0;j<horar.length;j++){
                horar[j].prog.cancel();
            }
            global.horariosProgramados=global.horariosProgramados.filter(x => { return x.id!==idsHorarios[i]});
        }

        global.mutex.release(release);

        res.json({
            ok: true,
            msg: 'usuarioSalir',
            codigo: 201006,
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error actualizando grupo',
            codigo: 400005
        });
    }

}

const eliminarGrupo = async(req, res) => {

    const uid = req.params.id;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    if (validarPermisos(token, ['ROL_CUIDADOR'])) {
        // Solo pueden borrar grupos los cuidadores
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para borrar grupos',
            codigo: 401004
        });
    }

    try {

        let idsHorarios=[];

        await db.runTransaction(async (transaction) => {

            idsHorarios = [];

            const existeGrupo = await transaction.get(db.collection('grupos').doc(uid));

            if (!existeGrupo.exists) {
                return res.status(401).json({
                    ok: false,
                    msg: 'El grupo no existe',
                    codigo: 401007
                });
            }

            if(existeGrupo.data().uidUsuarioCreador!=informacionToken.email){
                return res.status(401).json({
                    ok: false,
                    msg: 'No puedes actualizar un grupo que no es tuyo',
                    codigo: 401011
                });
            }

            const zonas = await db.collection('zonas').where('uidGrupo', '==', existeGrupo.id).get();

            for(let i=0;i<zonas.docs.length;i++){

                const horariosZona = await db.collection('horarios').where('uidZona', '==', zonas.docs[i].id).get();
    
                for(let m=0;m<horariosZona.docs.length;m++){
                            
                    transaction.delete(db.collection('horarios').doc(horariosZona.docs[m].id));

                    idsHorarios.push(horariosZona.docs[m].id);
    
                }
    
                transaction.delete(db.collection('zonas').doc(zonas.docs[i].id));

            }

            transaction.delete(db.collection('grupos').doc(uid));

          });

        if(res.headersSent) return;

        const release = await global.mutex.acquire();

        //Si se han borrado horarios, se eliminan
        for(let i=0;i<idsHorarios.length;i++){
            let horar=global.horariosProgramados.filter(x => { return x.id===idsHorarios[i]});
            for(let n=0;n<horar.length;n++){
                horar[n].prog.cancel();
            }
            global.horariosProgramados=global.horariosProgramados.filter(x => { return x.id!==idsHorarios[i]});
        }

        global.mutex.release(release);

        res.json({
            ok: true,
            msg: 'borrarGrupo',
            codigo: 200003,
            grupo: uid
        });

    } catch (error) {
        console.log(error);

        return res.status(400).json({
            ok: false,
            msg: 'Error borrando grupo',
            codigo: 400006
        });
    }

}


module.exports = { obtenerGrupos, crearGrupo, actualizarGrupo, unirseGrupo, recibirNotificaciones, salirGrupo, eliminarGrupo }