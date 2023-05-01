const { response } = require('express');
const bcrypt = require('bcryptjs');
const emailValidator = require("node-email-validation");
const { validarPermisos } = require('../helpers/validarPermisos');
const { validarContrasena } = require('../helpers/validarContrasena');
const { infoToken } = require('../helpers/infoToken');
const { enviarNotificacion } = require('../helpers/enviarNotificacion');
const { comprobarDentro } = require('../helpers/comprobarDentro');
const { enHorario } = require('../helpers/enHorario');
const { crearNotificacion } = require('../helpers/crearNotificacion');
const { validarPosicion } = require('../helpers/validar-posicion');
const admin = require("firebase-admin");
const { compararDiaSiguiente } = require('../helpers/compararDiaSiguiente');
const db=admin.firestore();
const stripe = require("stripe")('sk_test_51MVu8tLlC1zWBhNL6yv1f2vvjYVxc0F3xNBeLERfGkEsRr1piXxvxnRuDXUx7ReMM0648T6SYxCDYlISHZOwqble00eBmuzLbt');


const obtenerUsuarios = async(req, res) => {
    let uidGrupo = req.query.uidGrupo;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    //De momento solo puede listar usuarios el admin
    if (validarPermisos(token, ["ROL_CUIDADOR"])) {
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para listar usuarios',
            codigo: 401004
        });
    }
    try {
        //Una peticion distinta en funcion del parametro
        let usuarios = [];
        if(uidGrupo){
            let grupo = await db.collection('grupos').doc(uidGrupo).get();

            if(grupo.exists && (grupo.data().uidUsuarioCreador==informacionToken.email || grupo.data().uidUsuarios.includes(informacionToken.email))){
                for(let i=0;i<grupo.data().uidUsuarios.length;i++){
                    if(grupo.data().uidUsuarios[i]!=informacionToken.email){
                        let existeUsuario = await db.collection('usuarios').doc(grupo.data().uidUsuarios[i]).get();
                        if(existeUsuario.exists){
                            const data = existeUsuario.data();
                            delete data.contrasenya;
                            const UsuarioConId = { email: existeUsuario.id, ...data };
                            usuarios=usuarios.concat(UsuarioConId);
                        }
                    }
                }
            }   
        }else{          //Obtener todos los usuarios de los grupos de ese usuario (para la interfaz cuidador-inicio)
            let grupos = await db.collection('grupos').where('uidUsuarios', 'array-contains', informacionToken.email).get();
            let usuariosTotales = await db.collection('usuarios').get();
            usuariosTotales = usuariosTotales.docs.map(userDoc => {
                const userData = userDoc.data();
                delete userData.contrasenya;
                userData.email=userDoc.id;
                return userData;
              });
            
            usuariosTotales = usuariosTotales.filter(x=> x.email!=informacionToken.email);

            for(let i=0;i<grupos.docs.length;i++){
                for(let j=0;j<grupos.docs[i].data().uidUsuarios.length;j++){
                    let existeUsuario = usuariosTotales.find(x=> x.email==grupos.docs[i].data().uidUsuarios[j]);
                    let yaExiste = usuarios.find(x=> x.email==grupos.docs[i].data().uidUsuarios[j]);           //Si ya estaba ese usuario en la lista no se repite
                    if(existeUsuario && !yaExiste){
                        usuarios=usuarios.concat(existeUsuario);
                    }
                }
            }
        }

        res.json({
            ok: true,
            msg: 'obtenerUsuarios',
            codigo: 200001,
            usuarios
        });

    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            msg: 'Error obteniendo usuarios',
            codigo: 400007
        });
    }
}


const crearUsuario = async(req, res = response) => {

    const { email, contrasenya, nombre, rol, ...object } = req.body;

    try {

        if (contrasenya == email) {
            return res.status(400).json({
                ok: false,
                msg: 'Usuario y contraseña no pueden ser iguales',
                codigo: 400001
            });
        }

        if (!emailValidator.is_email_valid(email)) {
            return res.status(400).json({
                ok: false,
                msg: 'Email no es válido',
                codigo: 400002
            });
        }

        if (!validarContrasena(contrasenya)) {
            return res.status(400).json({
                ok: false,
                msg: 'La contraseña debe tener entre 8 y 32 caracteres y contener una mayúscula, minúscula y número',
                codigo: 400003
            });
        }

        let usuarioNuevo={};

        let emailMin=email.toLowerCase();

        const usuarioBD = await db.collection('usuarios').doc(emailMin).get();

        if (usuarioBD.exists) {
            return res.status(400).json({
                ok: false,
                msg: 'Email ya existe',
                codigo: 400000
            });
        }
        //Ciframos la contrasena con un salt, para almacenarla en la BD
        const salt = bcrypt.genSaltSync();
        let contrasenaCifrada = '';
        contrasenaCifrada = bcrypt.hashSync(contrasenya, salt);
        
        let ultNotif=new Date();
        ultNotif.setDate(ultNotif.getDate() - 1);

        usuarioNuevo = {
            contrasenya: contrasenaCifrada,
            rol: rol,
            nombre: nombre,
            suscripcion: false,                      //Esto cambiar despues a false
            fechaSuscripcion: new Date(),
            posicion: '',
            tokenDispositivo: '',
            ultimaActPosicion: new Date(),
            ultimaNotificacion: ultNotif
        };

        await db.collection('usuarios').doc(emailMin).create(usuarioNuevo);

        usuarioNuevo.email=email;

        res.json({
            ok: true,
            msg: 'crearUsuario',
            codigo: 201002,
            usuario: usuarioNuevo
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error creando usuario',
            codigo: 400004
        });
    }
}


const actualizarUsuario = async(req, res) => {

    const { nombre, posicion, ...object } = req.body;
    let tokenDispositivo;
    if(req.body.hasOwnProperty("tokenDispositivo")){
        tokenDispositivo=req.body.tokenDispositivo;
    }
    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    try {

        if(!nombre && !posicion && !req.body.hasOwnProperty("tokenDispositivo")){
            return res.status(400).json({
                ok: false,
                msg: 'Necesitas pasar algun parametro',
                codigo: 400010
            });
        }

        if(posicion){
            if(!validarPosicion(posicion)){
                return res.status(400).json({
                    ok: false,
                    msg: 'Argumentos recibidos inválidos',
                    codigo: 400012,
                });
            }
        }


        const usuarioBD = await db.collection('usuarios').doc(informacionToken.email).get();

        if (!usuarioBD.exists) {
            return res.status(401).json({
                ok: false,
                msg: 'El usuario no existe',
                codigo: 401002
            });
        }

        //Coge los grupos donde esta el usuario, las zonas de ese grupo. Para cada zona
        //comprueba si estaba dentro y si lo esta ahora. Si esta en algun horario en esa zona, se indica
        //que esta en horario. Si no estaba dentro y ahora si, notificacion al cuidador. Si estaba
        //dentro y ahora no, notificacion al usuario. Se crea notificacion a los cuidadores del grupo
        //que tengan activada la notificacion para ese grupo (si esta suscrito, siempre; si no lo esta
        //se comprueba la ultima notificacion si ha pasado un dia). Y en el caso de que el usuario este
        //logueado se le envia una push
        if(posicion && informacionToken.rol=="ROL_DEPENDIENTE"){

            let usuarios = await db.collection('usuarios').get();

            usuarios = usuarios.docs.map(userDoc => {
                const userData = userDoc.data();
                userData.id=userDoc.id;
                return userData;
              });

            const zonas = await db.collection('zonas').get();
            const horarios = await db.collection('horarios').get();

            let grupos = await db.collection('grupos').where('uidUsuarios', 'array-contains', informacionToken.email).get();

            //Para cada grupo del usuario
            for(let p=0;p<grupos.docs.length;p++){
                let zonasUsu=[];
                let zonasAux = zonas.docs.filter((x) => x.data().uidGrupo==grupos.docs[p].id);
                zonasUsu = zonasUsu.concat(zonasAux);

                //Primero comprobar si antes estaba dentro o fuera para cada zona del grupo
                for(let i=0;i<zonasUsu.length;i++){

                    //Comprueba si estaba dentro o fuera de la zona, antes
                    let estabaDentro=false;
                    if(usuarioBD.data().posicion!=""){
                        estabaDentro=comprobarDentro(usuarioBD.data().posicion, zonasUsu[i].data().posicion, zonasUsu[i].data().radio);
                    }

                    //Comprueba si esta dentro o fuera de la zona, con la posicion
                    let estaDentro=comprobarDentro(posicion, zonasUsu[i].data().posicion, zonasUsu[i].data().radio);

                    let estaEnAlgunHorario=[];

                    if(estabaDentro!=estaDentro){   //En el caso en que haya entrado o salido de la zona, comprobar si estaba en algun horario de esa zona o no
                        
                        let horariosAux = horarios.docs.filter((x) => x.data().uidZona==zonasUsu[i].id && x.data().uidUsuarios.includes(informacionToken.email));
        
                        for(let r=0;r<horariosAux.length;r++){
                            let dentroHorario=enHorario(horariosAux[r]);
                            if(dentroHorario){
                                estaEnAlgunHorario.push(r);
                            }
                        }
                    }

                    //Aqui hago la comprobacion de que esta pasando con esa ubicacion, si esta saliendo, entrando, etc.
                    let cuerpoMensaje="";
                    let tipoZona="segura";
                    if(zonasUsu[i].data().tipo=="ZONA_PROHIBIDA"){
                        tipoZona="prohibida";
                    }

                    if(estaEnAlgunHorario.length>0){
                        if(estabaDentro && !estaDentro && tipoZona=="segura"){    //Ha salido de la zona segura estando en un horario de esta zona
                            cuerpoMensaje=usuarioBD.data().nombre+" ha salido de zona "+tipoZona+" ("+zonasUsu[i].data().nombre+") estando en horario"; 
                        }else if(!estabaDentro && estaDentro && tipoZona=="prohibida"){  //Ha entrado a la zona prohibida estando en un horario de esta zona
                            cuerpoMensaje=usuarioBD.data().nombre+" ha entrado a zona "+tipoZona+" ("+zonasUsu[i].data().nombre+") estando en horario"; 
                        }
                    }else{
                        if(estabaDentro && !estaDentro && tipoZona=="segura"){    //Ha salido de la zona segura
                            cuerpoMensaje=usuarioBD.data().nombre+" ha salido de zona "+tipoZona+" ("+zonasUsu[i].data().nombre+")"; 
                        }else if(!estabaDentro && estaDentro && tipoZona=="prohibida"){  //Ha entrado a la zona prohibida
                            cuerpoMensaje=usuarioBD.data().nombre+" ha entrado a zona "+tipoZona+" ("+zonasUsu[i].data().nombre+")";
                        }
                    }

                    //Si hay algun mensaje para esta zona, creame la notificacion para cada usuario cuidador del grupo
                    if(cuerpoMensaje!=""){
                            //Para cada relacion usu-grupo de esta zona sacame los usuarios cuidadores del grupo
                        let ususCuidad=[];
                        let ususCuidadPush=[];
    
                        for(let j=0;j<grupos.docs[p].data().uidUsuarios.length;j++){
                            let usuariosCuidAux = usuarios.find((x) => x.id==grupos.docs[p].data().uidUsuarios[j] && x.rol=="ROL_CUIDADOR");
                            if(usuariosCuidAux && grupos.docs[p].data().notificaciones[j]){
                                if(usuariosCuidAux.suscripcion || (!usuariosCuidAux.suscripcion && compararDiaSiguiente(usuariosCuidAux.ultimaNotificacion))){
                                    ususCuidad = ususCuidad.concat(usuariosCuidAux);
                                    if(usuariosCuidAux.tokenDispositivo!=""){
                                        ususCuidadPush = ususCuidadPush.concat(usuariosCuidAux);
                                    }
                                }
                            }
                        }
    
                        //De cada usuario con token, cojo el token y me lo guardo
                        let registrationTokens=[];
                        for(let j=0;j<ususCuidadPush.length;j++){
                            registrationTokens.push(ususCuidadPush[j].tokenDispositivo);
                        }

                        for(let j=0;j<ususCuidad.length;j++){
                            crearNotificacion(cuerpoMensaje, ususCuidad[j].id);
                            //Le actualizo la ultima notificacion a nivel de aplicacion, no de base de datos, para no tener que obtener cada usuario por separado
                            const usu = usuarios.find(elemento => elemento.id === ususCuidad[j].id);
                            if (usu) {
                                usu.ultimaNotificacion = admin.firestore.Timestamp.fromDate(new Date());
                            }
                        }

                        //Si hay tokens para enviar, genero el payload y envio la notificacion push 
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

        let obj={};
        if(nombre) obj.nombre=nombre;
        if(posicion) obj.posicion=posicion;
        if(tokenDispositivo || req.body.hasOwnProperty("tokenDispositivo")) obj.tokenDispositivo=tokenDispositivo;
        if(posicion) obj.ultimaActPosicion=new Date();

        await db.collection('usuarios').doc(informacionToken.email).update(obj);

        res.json({
            ok: true,
            msg: 'actualizarUsuario',
            codigo: 201001,
            usuario: obj
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error actualizando usuario',
            codigo: 400005
        });
    }

}

const actualizarContrasenya = async(req, res) => { //solo actualizar tu contrasena

    const { contrasenya, nuevaContrasenya } = req.body;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    //Solo pueden actualizar contrasenya los cuidadores
    if (validarPermisos(token, ["ROL_CUIDADOR"])) {
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para actualizar contraseña',
            codigo: 401004
        });
    }

    try {

        if (!validarContrasena(nuevaContrasenya)) {
            return res.status(400).json({
                ok: false,
                msg: 'La contraseña debe tener entre 8 y 32 caracteres y contener una mayúscula, minúscula y número',
                codigo: 400003
            });
        }

        if (nuevaContrasenya == contrasenya) {
            return res.status(400).json({
                ok: false,
                msg: 'La contraseña debe ser distinta a la antigua',
                codigo: 400008
            });
        }

        const usuarioBD = await db.collection('usuarios').doc(informacionToken.email).get();

        if (!usuarioBD.exists) {
            return res.status(401).json({
                ok: false,
                msg: 'El usuario no existe',
                codigo: 401002
            });
        }

        const contrasenaValida = bcrypt.compareSync(contrasenya, usuarioBD.data().contrasenya);

        if (!contrasenaValida) {
            return res.status(401).json({
                ok: false,
                msg: 'Usuario o contraseña incorrectos',
                codigo: 401003,
                token: ''
            });
        }

        if (nuevaContrasenya == usuarioBD.id) {
            return res.status(400).json({
                ok: false,
                msg: 'Usuario y email no pueden ser iguales',
                codigo: 400001,
            });
        }
        

        const salt = bcrypt.genSaltSync();
        const contrasenyaCifrada = bcrypt.hashSync(nuevaContrasenya, salt);

        let obj={};
        obj.contrasenya=contrasenyaCifrada;

        const usuario = await db.collection('usuarios').doc(informacionToken.email).update(obj);


        res.status(201).json({
            ok: true,
            msg: 'actualizarContrasena',
            codigo: 201011,
            usuario
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error actualizando contraseña',
            codigo: 400005
        });
    }
}

const actualizarEstadoPago = async(req, res) => {

    let suscripcion = req.body.suscripcion;
    const tokenTarjeta = req.body.tokenTarjeta;
    const token = req.header('x-token');
    const informacionToken = infoToken(token);

    //Solo pueden suscribirse los cuidadores
    if (validarPermisos(token, ["ROL_CUIDADOR"])) {
        return res.status(401).json({
            ok: false,
            msg: 'No tiene permisos para actualizar estado de pago',
            codigo: 401004
        });
    }


    try {

        if (typeof suscripcion !== 'boolean') {
            return res.status(400).json({
                ok: false,
                msg: 'El argumento suscripcion debe ser boolean',
                codigo: 400012
            });
        }

        if(suscripcion && !tokenTarjeta){
            return res.status(400).json({
                ok: false,
                msg: 'El token de tarjeta generado con Stripe es obligatorio',
                codigo: 400012
            });
        }

        const usuarioBD = await db.collection('usuarios').doc(informacionToken.email).get();

        if (!usuarioBD.exists) {
            return res.status(401).json({
                ok: false,
                msg: 'El usuario no existe',
                codigo: 401002
            });
        }

        if(usuarioBD.data().suscripcion && suscripcion==true){
            return res.status(401).json({
                ok: false,
                msg: 'El usuario ya está suscrito',
                codigo: 401026
            });
        }

        if(!usuarioBD.data().suscripcion && suscripcion==false){
            return res.status(401).json({
                ok: false,
                msg: 'El usuario no está suscrito',
                codigo: 401027
            });
        }


        let err=false;
        let txt="";
        let codigo=0;
        let status="";
        let payment_method_id="";

        let idsHorarios=[];

        let usu={};

        if(suscripcion==true){

            let customer = await stripe.customers.list({email: informacionToken.email, limit: 1});

            if (customer.data.length === 0) {
                customer = await stripe.customers.create({name: usuarioBD.data().nombre, email: informacionToken.email});
            } else {
                customer = customer.data[0];
            }

            let idCliente=customer.id;

            let tarjeta = {
                type: 'card',
                card: {
                    token: tokenTarjeta,
                }
            }
            //Crea el metodo de pago con el token de la tarjeta
            err=await stripe.paymentMethods.create(tarjeta).then((charge) => {
                        payment_method_id=charge.id;
                        return false;
                    }).catch((err) => {
                        switch (err.type) {
                            case 'StripeCardError':
                                txt="Tarjeta de crédito errónea";
                                codigo=401020;
                            break;
                            case 'StripeInvalidRequestError':
                                txt="Parametros invalidos";
                                codigo=401021;
                            break;
                            default:
                                txt="Ha ocurrido un problema con Stripe";
                                codigo=401022
                            break;
                        }
                        console.log(err);
                        return true;
                });
            //Si no hay ningun error con la tarjeta le hago el pago
            if(err==false){
                let pago = {
                    amount: 2995,
                    currency: 'EUR',
                    payment_method_types: ['card'],
                    payment_method: payment_method_id,
                    customer: idCliente,
                    description: 'Suscripción con Stripe a GeoDependent',
                    confirm: 'true'
                }
                err=await stripe.paymentIntents.create(pago).then((charge) => {
                            status=charge.status;
                            return false;
                        }).catch((err) => {
                            txt=err.message;
                            console.log(err);
                            switch (err.type) {
                            case 'StripeCardError':
                                txt="Tarjeta de crédito errónea";
                                codigo=401020;
                                break;
                            case 'StripeInvalidRequestError':
                                txt="Parametros invalidos";
                                codigo=401021;
                                break;
                            default:
                                txt="Ha ocurrido un problema con Stripe";
                                codigo=401022
                            break;
                            }
                            return true;
                    });
                }
            if(err==true){
                return res.status(401).json({
                    ok: false,
                    msg: txt,
                    codigo: codigo
                });
            }

            if(status!="succeeded"){
                return res.status(401).json({
                    ok: false,
                    msg: "El pago no se ha realizado correctamente",
                    codigo: 401019
                });
            }

            usu = {};
            usu.suscripcion=suscripcion;
            usu.fechaSuscripcion=new Date();
            await db.collection('usuarios').doc(informacionToken.email).update(usu);
        }else{

            await db.runTransaction(async (transaction) => {

                idsHorarios=[];

                usu = {};
                usu.suscripcion=suscripcion;
                usu.fechaSuscripcion=new Date();

                //Borrar sus grupos menos 1 etc
                if(!suscripcion){
                    const existeGrupo = await transaction.get(db.collection('grupos').where('uidUsuarios', 'array-contains', informacionToken.email));
        
                    if (!existeGrupo.empty) {
                        
                        for(let i=0;i<existeGrupo.docs.length;i++){
                            if(existeGrupo.docs[i].data().uidUsuarioCreador==informacionToken.email){    //Borrar el grupo, las zonas y horarios de ese grupo
                                //Borrar las zonas que tenga asociadas
            
                                let zonas = await db.collection('zonas').where('uidGrupo', '==', existeGrupo.docs[i].id).get();
            
                                for(let j=0;j<zonas.docs.length;j++){

                                    const horariosZona = await db.collection('horarios').where('uidZona', '==', zonas.docs[j].id).get();
                        
                                    for(let m=0;m<horariosZona.docs.length;m++){
                                                
                                        transaction.delete(db.collection('horarios').doc(horariosZona.docs[m].id));
                    
                                        idsHorarios.push(horariosZona.docs[m].id);
                        
                                    }
                        
                                    transaction.delete(db.collection('zonas').doc(zonas.docs[j].id));
                    
                                }
                    
                                transaction.delete(db.collection('grupos').doc(existeGrupo.docs[i].id));
            
                            }else{
                                let uidUsuarios = existeGrupo.docs[i].data().uidUsuarios;
                                let notif = existeGrupo.docs[i].data().notificaciones;
                                let idx = existeGrupo.docs[i].data().uidUsuarios.indexOf(informacionToken.email);
                                if(idx!=-1){
                                    uidUsuarios.splice(idx, 1);
                                    notificaciones.splice(idx, 1);
                                }

                                grupo = {
                                    uidUsuarios: uidUsuarios,
                                    notificaciones: notif
                                };

                                transaction.update(db.collection('grupos').doc(existeGrupo.docs[i].id), grupo);
                            }
                        }
                    }   
                }

                transaction.update(db.collection('usuarios').doc(informacionToken.email), usu);
                
            });
        }

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

        res.status(201).json({
            ok: true,
            msg: 'actualizarEstadoPago',
            codigo: 201012,
            usuario: informacionToken.email,
            suscripcion: usu.suscripcion,
            fechaSuscripcion: usu.fechaSuscripcion
        });


    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error actualizando pagado',
            codigo: 400005
        });
    }

}

module.exports = { obtenerUsuarios, crearUsuario, actualizarUsuario, actualizarContrasenya, actualizarEstadoPago }