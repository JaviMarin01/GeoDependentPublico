const { response } = require('express');
const { validarPermisos } = require('../helpers/validarPermisos');
const { infoToken } = require('../helpers/infoToken');
const { validarPosicion } = require('../helpers/validar-posicion');
const admin = require("firebase-admin");
const db=admin.firestore();

const obtenerZonas = async(req, res) => {
    let uidGrupo = req.query.uidGrupo;
    let id = req.query.id;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);
    
    // Solo pueden obtener zonas los cuidadores
    if (validarPermisos(token, ['ROL_CUIDADOR'])) {
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para listar zonas',
            codigo: 401004
        });
    }
    
    try {
        let zonas = [];

        if(uidGrupo){      //Si se le pasa un uid del grupo, se le comprueba que sea un uid de un grupo suyo y luego se hace la busqueda de la zona
            let grupo = await db.collection('grupos').doc(uidGrupo).get();

            if(grupo.exists && (grupo.data().uidUsuarioCreador==informacionToken.email || grupo.data().uidUsuarios.includes(informacionToken.email))){
                let zonasAux = await db.collection('zonas').where('uidGrupo', '==', uidGrupo).get();
                const zon = zonasAux.docs.map((doc) => {
                    const data = doc.data();
                    const id = doc.id;
                    return { id, ...data };
                  });
                zonas=zonas.concat(zon);
            }   

        }else if(id){       //Si se le pasa un id de zona, se le comprueba que sea un uid de un grupo suyo y luego se hace la busqueda de la zona
            const existeZona = await db.collection('zonas').doc(id).get();

            if(existeZona.exists){
                let grupo = await db.collection('grupos').doc(existeZona.data().uidGrupo).get();

                if(grupo.exists && (grupo.data().uidUsuarioCreador==informacionToken.email || grupo.data().uidUsuarios.includes(informacionToken.email))){
                    const data = existeZona.data();
                    const zonaConId = { id: existeZona.id, ...data };
                    zonas = zonas.concat(zonaConId);
                }
            }
        }else{          //Obtener todas las zonas de los grupos de ese usuario (para la interfaz cuidador-inicio)
            let grupos = await db.collection('grupos').where('uidUsuarios', 'array-contains', informacionToken.email).get();

            for(let i=0;i<grupos.docs.length;i++){
                let zonasAux = await db.collection('zonas').where('uidGrupo', '==', grupos.docs[i].id).get();
                const zon = zonasAux.docs.map((doc) => {
                    const data = doc.data();
                    const id = doc.id;
                    return { id, ...data };
                  });
                zonas=zonas.concat(zon);
            }
        }

        res.json({
            ok: true,
            msg: 'obtenerZona',
            codigo: 200004,
            zonas
        });

    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            msg: 'Error obteniendo zonas',
            codigo: 400007
        });
    }
}


const crearZona = async(req, res = response) => {

    const { nombre, tipo, radio, posicion, uidGrupo, ...object } = req.body;

    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    //Las zonas solo las pueden crear los cuidadores
    if (validarPermisos(token, ['ROL_CUIDADOR'])) {
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para crear zonas',
            codigo: 401004
        });
    }

    try {

        if(tipo!="ZONA_SEGURA" && tipo!="ZONA_PROHIBIDA"){
            return res.status(400).json({
                ok: false,
                msg: 'El tipo de zona debe ser segura o prohibida',
                codigo: 400009
            });
        }

        if(!validarPosicion(posicion)){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }

        let zonaNueva = {};
        let id="";
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

            const usuarioBD = await db.collection('usuarios').doc(existeGrupo.data().uidUsuarioCreador).get();
        
            if (!usuarioBD.exists) {
                return res.status(401).json({
                    ok: false,
                    msg: 'El usuario no existe',
                    codigo: 401002
                });
            }

            zonaNueva = {
                nombre: nombre,
                tipo: tipo,
                radio: Number(radio),
                posicion: posicion,
                uidGrupo: uidGrupo
            };

            let zona=db.collection('zonas').doc();

            id=zona.id;

            if(!usuarioBD.data().suscripcion){

                let zonas = await transaction.get(db.collection('zonas').where('uidGrupo', '==', uidGrupo));
    
                if(zonas.docs.length>0){
                    return res.status(401).json({
                        ok: false,
                        msg: 'Solo puede haber 1 zona como máximo en un grupo si el creador no está suscrito',
                        codigo: 401017
                    });
                }
            }
    
            transaction.set(db.collection('zonas').doc(zona.id), zonaNueva);
            
        });

        zonaNueva.id=id;

        if(res.headersSent) return;

        res.json({
            ok: true,
            msg: 'crearZona',
            codigo: 201007,
            zona: zonaNueva
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error creando zona',
            codigo: 400004
        });
    }
}


const actualizarZona = async(req, res) => {

    const { nombre, tipo, radio, posicion, ...object } = req.body;
    const uid = req.params.id;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    // Solo pueden actualizar zonas cuidadores
    if (validarPermisos(token, ['ROL_CUIDADOR'])) {
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para actualizar zonas',
            codigo: 401004
        });
    }

    try {

       

        //Si no se le pasa una zona correcta
        if(tipo!="ZONA_SEGURA" && tipo!="ZONA_PROHIBIDA"){
            return res.status(400).json({
                ok: false,
                msg: 'El tipo de zona debe ser segura o prohibida',
                codigo: 400009
            });
        }

        if(!validarPosicion(posicion)){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }

        let zona = {};
        //Si algo falla, se deshacen los cambios (en el caso de comprobar si un usuario crea un grupo, si entran 2 peticiones simultaneas, se hace una y despues la otra, para no dar fallos)
        await db.runTransaction(async (transaction) => {

            //Si alguien modifica la zona a la vez, se vuelve a ejecutar la transaccion otra vez
            const existeZona = await transaction.get(db.collection('zonas').doc(uid));

            if (!existeZona.exists) {
                return res.status(401).json({
                    ok: false,
                    msg: 'La zona no existe',
                    codigo: 401008
                });
            }

            //En cambio con el grupo no, porque no interesa detectar si alguien lo ha modificado
            const existeGrupo = await db.collection('grupos').doc(existeZona.data().uidGrupo).get();

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

            zona = {
                nombre: nombre,
                tipo: tipo,
                radio: Number(radio),
                posicion: posicion
            };
    
            transaction.update(db.collection('zonas').doc(uid), zona);
        });

        if(res.headersSent) return;

        res.json({
            ok: true,
            msg: 'actualizarZona',
            codigo: 201008,
            zona: zona
        });
        

    } catch (error) {
        return res.status(400).json({
            ok: false,
            msg: 'Error actualizando zona',
            codigo: 400005
        });
    }

}

const eliminarZona = async(req, res) => {

    const uid = req.params.id;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    // Solo pueden borrar zonas los cuidadores
    if (validarPermisos(token, ['ROL_CUIDADOR'])) {
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para borrar zonas',
            codigo: 401004
        });
    }

    try {

        let idsHorarios=[];

        await db.runTransaction(async (transaction) => {

            idsHorarios=[];

            const existeZona = await transaction.get(db.collection('zonas').doc(uid));

            if (!existeZona.exists) {
                return res.status(401).json({
                    ok: false,
                    msg: 'La zona no existe',
                    codigo: 401008
                });
            }

            const existeGrupo = await db.collection('grupos').doc(existeZona.data().uidGrupo).get();

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

            const horariosZona = await db.collection('horarios').where('uidZona', '==', uid).get();

            for(let m=0;m<horariosZona.docs.length;m++){
                            
                transaction.delete(db.collection('horarios').doc(horariosZona.docs[m].id));

                idsHorarios.push(horariosZona.docs[m].id);

            }

            transaction.delete(db.collection('zonas').doc(uid));
        });


        if(res.headersSent) return;

        const release = await global.mutex.acquire();

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
            msg: 'borrarZona',
            codigo: 200005,
            zona: uid
        });

    } catch (error) {
        console.log(error);

        return res.status(400).json({
            ok: false,
            msg: 'Error borrando zona',
            codigo: 400006
        });
    }

}


module.exports = { obtenerZonas, crearZona, actualizarZona, eliminarZona }