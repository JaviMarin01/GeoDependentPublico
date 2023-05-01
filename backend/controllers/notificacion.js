const { validarPermisos } = require('../helpers/validarPermisos');
const { infoToken } = require('../helpers/infoToken');
const { validarArrayString } = require('../helpers/validar-array-string');
const admin = require('firebase-admin');
const db = admin.firestore();

const obtenerNotificaciones = async(req, res) => {
    const token = req.header('x-token');
    const informacionToken = infoToken(token);
    
    // Solo pueden obtener notificaciones los cuidadores
    if (validarPermisos(token, ['ROL_CUIDADOR'])) {
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para listar notificaciones',
            codigo: 401004
        });
    }
    
    try {
        
        let notificaciones = [];

        notificaciones = await db.collection('notificaciones').where('uidUsuario', '==', informacionToken.email).orderBy('fecha', 'desc').get();

        notificaciones = notificaciones.docs.map(doc => {
            const data = doc.data();
            const id = doc.id;
            return { id, ...data };
        });

        res.json({
            ok: true,
            msg: 'obtenerNotificacion',
            codigo: 200008,
            notificaciones: notificaciones
        });

    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            msg: 'Error obteniendo notificacion',
            codigo: 400007
        });
    }
}


const leerNotificaciones = async(req, res) => {

    const {uidNotificaciones, ...object } = req.body;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    // Solo pueden leer notificaciones los cuidadores
    if (validarPermisos(token, ['ROL_CUIDADOR'])) {
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para leer notificaciones',
            codigo: 401004
        });
    }

    try {

        if(!validarArrayString(uidNotificaciones)){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }

        let duplicados = uidNotificaciones => uidNotificaciones.filter((item, index) => uidNotificaciones.indexOf(item) != index);
        if(duplicados(uidNotificaciones).length>0){
            return res.status(400).json({
                ok: false,
                msg: 'No puedes introducir valores iguales',
                codigo: 400011,
            });
        }

        let leidos=[];
        let actNotif=[];

        await db.runTransaction(async (transaction) => {

            let notificaciones = await transaction.get(db.collection('notificaciones').where('uidUsuario', '==', informacionToken.email));
            for(let i=0;i<uidNotificaciones.length;i++){
                let existeNotificacion=notificaciones.docs.find(x => { return x.id==uidNotificaciones[i]});
                if(!existeNotificacion){
                    return res.status(401).json({
                        ok: false,
                        msg: 'La notificacion no te pertenece',
                        codigo: 401012
                    });
                }
                if(existeNotificacion.data().leido){
                    return res.status(401).json({
                        ok: false,
                        msg: 'La notificacion ya ha sido leida',
                        codigo: 401025
                    });
                }
                actNotif.push(existeNotificacion);
            }

            for(let i=0;i<actNotif.length;i++){
                let obj={
                    leido: true
                };
 
                transaction.update(db.collection('notificaciones').doc(actNotif[i].id), obj);

                let obj1=actNotif[i].data();
                obj1.leido=true;
                leidos.push(obj1);
            }
        });

        if(res.headersSent) return;

        res.json({
            ok: true,
            msg: 'leerNotificaciones',
            codigo: 201013,
            notificaciones: leidos
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error actualizando notificacion',
            codigo: 400005
        });
    }

}

const borrarNotificaciones = async(req, res) => {

    const {uidNotificaciones, ...object } = req.body;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    // Solo pueden borrar notificaciones los cuidadores
    if (validarPermisos(token, ['ROL_CUIDADOR'])) {
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para borrar notificaciones',
            codigo: 401004
        });
    }

    try {

        if(!validarArrayString(uidNotificaciones)){
            return res.status(400).json({
                ok: false,
                msg: 'Argumentos recibidos inválidos',
                codigo: 400012,
            });
        }

        let duplicados = uidNotificaciones => uidNotificaciones.filter((item, index) => uidNotificaciones.indexOf(item) != index);
        if(duplicados(uidNotificaciones).length>0){
            return res.status(400).json({
                ok: false,
                msg: 'No puedes introducir valores iguales',
                codigo: 400011,
            });
        }

        let borrados=[];
        let actNotif=[];

        await db.runTransaction(async (transaction) => {

            let notificaciones = await transaction.get(db.collection('notificaciones').where('uidUsuario', '==', informacionToken.email));
            for(let i=0;i<uidNotificaciones.length;i++){
                let existeNotificacion=notificaciones.docs.find(x => { return x.id==uidNotificaciones[i]});
                if(!existeNotificacion){
                    return res.status(401).json({
                        ok: false,
                        msg: 'La notificacion no te pertenece',
                        codigo: 401012
                    });
                }
                actNotif.push(existeNotificacion);
            }

            for(let i=0;i<actNotif.length;i++){
                transaction.delete(db.collection('notificaciones').doc(actNotif[i].id));
                borrados.push(actNotif[i].id);
            }
        });

        if(res.headersSent) return;

        res.json({
            ok: true,
            msg: 'borrarNotificaciones',
            codigo: 200009,
            notificaciones: borrados
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error borrando notificacion',
            codigo: 400006
        });
    }

}

module.exports = { obtenerNotificaciones, leerNotificaciones, borrarNotificaciones }