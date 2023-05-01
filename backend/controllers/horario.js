const { response } = require('express');
const { validarPermisos } = require('../helpers/validarPermisos');
const { infoToken } = require('../helpers/infoToken');
const { validarArrayString } = require('../helpers/validar-array-string');
const { validarHora } = require('../helpers/validarHora');
const { validarFormatoArrayDiasSemana } = require('../helpers/validar-formato-diasSemana');
const { comprobarFechaMinMax } = require('../helpers/comprobarFechaMinMax');
const { comprobarFechasSolapadas } = require('../helpers/comprobarFechasSolapadas');
const { programarHorarioConcreto } = require('../helpers/programarHorarioConcreto');
const admin = require("firebase-admin");
const { compararDiaSiguiente } = require('../helpers/compararDiaSiguiente');
const db=admin.firestore();

const obtenerHorarios = async(req, res) => {
    let uidGrupo = req.query.uidGrupo;
    let id = req.query.id;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);
    
    // Solo pueden obtener horarios los cuidadores
    if (validarPermisos(token, ['ROL_CUIDADOR'])) {
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para listar horarios',
            codigo: 401004
        });
    }
    
    try {

        //await new Promise(resolve => setTimeout(resolve, 7000));

        if(!uidGrupo && !id){
            return res.status(400).json({
                ok: false,
                msg: 'Necesitas pasar algun parametro',
                codigo: 400010
            });
        }
        
        let horarios = [];
        if(uidGrupo){      //Si se le pasa un uid de grupo, obtiene los horarios de ese grupo
            let grupo = await db.collection('grupos').doc(uidGrupo).get();

            if(grupo.exists && (grupo.data().uidUsuarioCreador==informacionToken.email || grupo.data().uidUsuarios.includes(informacionToken.email))){
                let zonas = await db.collection('zonas').where('uidGrupo', '==', uidGrupo).get();
                for(let i=0;i<zonas.docs.length;i++){
                    let existeHorario = await db.collection('horarios').where('uidZona', '==', zonas.docs[i].id).get();
                    if(!existeHorario.empty){
                        let hor = existeHorario.docs.map((doc) => {
                            const data = doc.data();
                            const id = doc.id;
                            return { id, ...data };
                          });
                        horarios=horarios.concat(hor);
                    }
                }
            }   
            
        }else if(id){       //Si se le pasa un id de zona, se le comprueba que sea un uid de un grupo suyo y luego se hace la busqueda de la zona

            const existeHorario = await db.collection('horarios').doc(id).get();

            if (existeHorario.exists) {
                const existeZona = await db.collection('zonas').doc(existeHorario.data().uidZona).get();
                if(existeZona.exists){
                    const grupo = await db.collection('grupos').doc(existeZona.data().uidGrupo).get();
                    if(grupo.exists && (grupo.data().uidUsuarioCreador==informacionToken.email || grupo.data().uidUsuarios.includes(informacionToken.email))){
                        const data = existeHorario.data();
                        const horarioConId = { id: existeHorario.id, ...data };
                        horarios=horarios.concat(horarioConId);
                    }
                }
            }
            
        }

        res.json({
            ok: true,
            msg: 'obtenerHorario',
            codigo: 200006,
            horarios
        });

    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            msg: 'Error obteniendo horarios',
            codigo: 400007
        });
    }
}


const crearHorario = async(req, res = response) => {

    const { uidUsuarios, uidZona, diasSemana, horas, ...object } = req.body;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    //El horario solo lo pueden crear los cuidadores
    if (validarPermisos(token, ['ROL_CUIDADOR'])) {
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para crear horarios',
            codigo: 401004
        });
    }

    try {

        if(!validarArrayString(uidUsuarios)){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }

        let duplicados = uidUsuarios => uidUsuarios.filter((item, index) => uidUsuarios.indexOf(item) != index);
        if(duplicados(uidUsuarios).length>0){
            return res.status(400).json({
                ok: false,
                msg: 'No puedes introducir valores iguales',
                codigo: 400011,
            });
        }

        if(!validarArrayString(diasSemana)){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }
        if(!validarFormatoArrayDiasSemana(diasSemana)){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }

    
        if(!validarArrayString(horas)){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }
        if(!validarHora(horas)){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }

        if(diasSemana.length!=horas.length){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }
        

        for(let i=0;i<diasSemana.length;i++){
            if(!comprobarFechaMinMax(diasSemana[i], horas[i])){
                return res.status(400).json({
                    ok: false,
                    msg: 'Argumentos recibidos inválidos',
                    codigo: 400012,
                });
            }
        }

        
        if(comprobarFechasSolapadas(diasSemana, horas)){
            return res.status(400).json({
                ok: false,
                msg: 'Las horas y dias pasados se solapan entre ellos',
                codigo: 400014
            });
        }

        let horarioNuevo = {};
        let id="";
        //Si algo falla, se deshacen los cambios (en el caso de comprobar si un usuario crea un grupo, si entran 2 peticiones simultaneas, se hace una y despues la otra, para no dar fallos)
        await db.runTransaction(async (transaction) => {

            const existeZona = await transaction.get(db.collection('zonas').doc(uidZona));

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

            for(let i=0;i<uidUsuarios.length;i++){

                const existeUsuario = await db.collection('usuarios').doc(uidUsuarios[i]).get();
    
                if (!existeUsuario.exists) {
                    return res.status(401).json({
                        ok: false,
                        msg: 'El usuario no existe',
                        codigo: 401002
                    });
                }
    
                if(existeUsuario.data().rol!="ROL_DEPENDIENTE"){
                    return res.status(401).json({
                        ok: false,
                        msg: 'El usuario no tiene el rol dependiente',
                        codigo: 401009
                    });
                }

                if(existeGrupo.data().uidUsuarioCreador != uidUsuarios[i] && !existeGrupo.data().uidUsuarios.includes(uidUsuarios[i])){
                    return res.status(401).json({
                        ok: false,
                        msg: 'No te pertenece el grupo',
                        codigo: 401012
                    });
                }
    
            }

            const usuarioBD = await transaction.get(db.collection('usuarios').doc(existeGrupo.data().uidUsuarioCreador));
        
            if (!usuarioBD.exists) {
                return res.status(401).json({
                    ok: false,
                    msg: 'El usuario no existe',
                    codigo: 401002
                });
            }

            horarioNuevo = {
                uidUsuarios: uidUsuarios,
                uidZona: uidZona,
                diasSemana: diasSemana,
                horas: horas,
                ultimaModificacion: new Date()
            };

            let horario=db.collection('horarios').doc();

            id=horario.id;

            if(!usuarioBD.data().suscripcion){

                let horarios=[];

                let zonas = await transaction.get(db.collection('zonas').where('uidGrupo', '==', existeGrupo.id));
                let zon = zonas.docs.map(userDoc => {
                    return userDoc.id;
                });

                if(zon.length>0){
                    let existeHorario = await db.collection('horarios').where('uidZona', 'in', zon).get();
                    if(!existeHorario.empty){
                        let hor = existeHorario.docs.map(doc => doc.data());
                        horarios=horarios.concat(hor);
                    }
                }
    
                if(horarios.length>0){
                    return res.status(401).json({
                        ok: false,
                        msg: 'Solo pueden haber 1 horario como máximo en un grupo si el creador no está suscrito',
                        codigo: 401018
                    });
                }
            }
    
            transaction.set(db.collection('horarios').doc(horario.id), horarioNuevo);

        });

        horarioNuevo.id=id;

        if(res.headersSent) return;

        const release = await global.mutex.acquire();

        programarHorarioConcreto(horarioNuevo);

        global.mutex.release(release);

        res.json({
            ok: true,
            msg: 'crearHorario',
            codigo: 201009,
            horario:horarioNuevo
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error creando horario',
            codigo: 400004
        });
    }
}


const actualizarHorario = async(req, res) => {

    const {uidUsuarios, uidZona, diasSemana, horas, ...object } = req.body;
    const uid = req.params.id;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    // Solo pueden actualizar horarios los cuidadores
    if (validarPermisos(token, ['ROL_CUIDADOR'])) {
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para actualizar horarios',
            codigo: 401004
        });
    }

    try {

        if(!validarArrayString(uidUsuarios)){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }

        let duplicados = uidUsuarios => uidUsuarios.filter((item, index) => uidUsuarios.indexOf(item) != index);
        if(duplicados(uidUsuarios).length>0){
            return res.status(400).json({
                ok: false,
                msg: 'No puedes introducir valores iguales',
                codigo: 400011,
            });
        }
        
        if(!validarArrayString(diasSemana)){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }
        if(!validarFormatoArrayDiasSemana(diasSemana)){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }
        if(!validarArrayString(horas)){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }
        if(!validarHora(horas)){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }

        if(diasSemana.length!=horas.length){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }

        for(let i=0;i<diasSemana.length;i++){
            if(!comprobarFechaMinMax(diasSemana[i], horas[i])){
                return res.status(400).json({
                    ok: false,
                    msg: 'Argumentos recibidos inválidos',
                    codigo: 400012,
                });
            }
        }

        
        if(comprobarFechasSolapadas(diasSemana, horas)){
            return res.status(400).json({
                ok: false,
                msg: 'Las horas y dias pasados se solapan entre ellos',
                codigo: 400014
            });
        }

        let horario = {};
        //Si algo falla, se deshacen los cambios (en el caso de comprobar si un usuario crea un grupo, si entran 2 peticiones simultaneas, se hace una y despues la otra, para no dar fallos)
        await db.runTransaction(async (transaction) => {

            const existeZona = await transaction.get(db.collection('zonas').doc(uidZona));

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

            const existeHorario = await transaction.get(db.collection('horarios').doc(uid));

            if (!existeHorario.exists) {
                return res.status(401).json({
                    ok: false,
                    msg: 'El horario no existe',
                    codigo: 401010
                });
            }

            const existeZonaHorario = await db.collection('zonas').doc(existeHorario.data().uidZona).get();

            if (!existeZonaHorario.exists) {
                return res.status(401).json({
                    ok: false,
                    msg: 'La zona no existe',
                    codigo: 401008
                });
            }

            if(existeZona.data().uidGrupo!=existeZonaHorario.data().uidGrupo){
                return res.status(401).json({
                    ok: false,
                    msg: 'No puedes modificar a una zona que es de otro grupo',
                    codigo: 401014
                });
            }

            const existeGrupoHorario = await db.collection('grupos').doc(existeZonaHorario.data().uidGrupo).get();

            if (!existeGrupoHorario.exists) {
                return res.status(401).json({
                    ok: false,
                    msg: 'El grupo no existe',
                    codigo: 401007
                });
            }

            if(existeGrupoHorario.data().uidUsuarioCreador != informacionToken.email && !existeGrupoHorario.data().uidUsuarios.includes(informacionToken.email)){
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

            if(!usuarioBD.data().suscripcion && !compararDiaSiguiente(existeHorario.data().ultimaModificacion)){
                return res.status(401).json({
                    ok: false,
                    msg: 'El horario solo puede ser modificado 1 vez al dia si el creador no esta suscrito',
                    codigo: 401013
                });
            }

            for(let i=0;i<uidUsuarios.length;i++){

                const existeUsuario = await db.collection('usuarios').doc(uidUsuarios[i]).get();
    
                if (!existeUsuario.exists) {
                    return res.status(401).json({
                        ok: false,
                        msg: 'El usuario no existe',
                        codigo: 401002
                    });
                }
    
                if(existeUsuario.data().rol!="ROL_DEPENDIENTE"){
                    return res.status(401).json({
                        ok: false,
                        msg: 'El usuario no tiene el rol dependiente',
                        codigo: 401009
                    });
                }

                if(existeGrupo.data().uidUsuarioCreador != uidUsuarios[i] && !existeGrupo.data().uidUsuarios.includes(uidUsuarios[i])){
                    return res.status(401).json({
                        ok: false,
                        msg: 'El usuario no pertenece al grupo',
                        codigo: 401012
                    });
                }
            }

            horario = {
                uidUsuarios: uidUsuarios,
                uidZona: uidZona,
                diasSemana: diasSemana,
                horas: horas,
                ultimaModificacion: new Date()
            };

            transaction.update(db.collection('horarios').doc(uid), horario);
            
        });

        horario.id=uid;

        if(res.headersSent) return;

        const release = await global.mutex.acquire();

        //Borro lo que tenia de antes y lo vuelvo a programar de nuevo, por si ha cambiado las horas
        let horar=global.horariosProgramados.filter(x => { return x.id===uid});
        for(let i=0;i<horar.length;i++){
            horar[i].prog.cancel();
        }
        global.horariosProgramados=global.horariosProgramados.filter(x => { return x.id!==uid});

        programarHorarioConcreto(horario);

        global.mutex.release(release);

        res.json({
            ok: true,
            msg: 'actualizarHorario',
            codigo: 201010,
            horario: horario
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error actualizando horario',
            codigo: 400005
        });
    }

}

const eliminarHorario = async(req, res) => {

    const uid = req.params.id;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    // Solo pueden borrar horarios los cuidadores
    if (validarPermisos(token, ['ROL_CUIDADOR'])) {
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para borrar horarios',
            codigo: 401004
        });
    }

    try {

        await db.runTransaction(async (transaction) => {
            const existeHorario = await transaction.get(db.collection('horarios').doc(uid));

            if (!existeHorario.exists) {
                return res.status(401).json({
                    ok: false,
                    msg: 'El horario no existe',
                    codigo: 401010
                });
            }

            const existeZona = await db.collection('zonas').doc(existeHorario.data().uidZona).get();

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

            transaction.delete(db.collection('horarios').doc(uid));

        });
        
        if(res.headersSent) return;

        const release = await global.mutex.acquire();

        let horar=global.horariosProgramados.filter(x => { return x.id===uid});
        for(let i=0;i<horar.length;i++){
            horar[i].prog.cancel();
        }
        global.horariosProgramados=global.horariosProgramados.filter(x => { return x.id!==uid});

        global.mutex.release(release);

        res.json({
            ok: true,
            msg: 'borrarHorario',
            codigo: 200007,
            horario: uid
        });

    } catch (error) {
        console.log(error);

        return res.status(400).json({
            ok: false,
            msg: 'Error borrando horario',
            codigo: 400006
        });
    }

}

module.exports = { obtenerHorarios, crearHorario, actualizarHorario, eliminarHorario }