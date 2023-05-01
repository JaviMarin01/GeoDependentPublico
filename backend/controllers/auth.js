const { response } = require('express');
const bcrypt = require('bcryptjs');
const { generarJWT } = require('../helpers/jwt');
const jwt = require('jsonwebtoken');
const admin = require("firebase-admin");
const db=admin.firestore();

const token = async(req, res = response) => {

    const token = req.headers['x-token'];

    try {
        //Verificamos que sea correcto el token
        const { email, rol, ...object } = jwt.verify(token, process.env.JWTSECRET);
        
        const usuarioBD = await db.collection('usuarios').doc(email).get();

        if (!usuarioBD.exists) {
            return res.status(401).json({
              ok: false,
              msg: 'Usuario no existe',
              codigo: 401002,
              token: ''
            });
        }

        //Actualizamos el token
        const nrol = usuarioBD.data().rol;
        const nuevoToken = await generarJWT(email, nrol);

        res.status(201).json({
            ok: true,
            msg: 'Token',
            codigo: 201000,
            email: email,
            rol: nrol,
            nombre: usuarioBD.data().nombre,
            token: nuevoToken,
            suscripcion: usuarioBD.data().suscripcion,
            fechaSuscripcion: usuarioBD.data().fechaSuscripcion
        });
    } catch {

        return res.status(500).json({
            ok: false,
            msg: 'token',
            codigo: 500,
            token: ''
        });
    }
}

const iniciarSesion = async(req, res = response) => {

    const { email, contrasenya, tokenDispositivo, hashLogin } = req.body;

    try {

        if(hashLogin!=process.env.HASHLOGIN){
            return res.status(401).json({
                ok: false,
                msg: 'Necesitas el hash para loguearte',
                codigo: 401005
            });
        }

        let emailMin=email.toLowerCase();

        const usuarioBD = await db.collection('usuarios').doc(emailMin).get();

        if (!usuarioBD.exists) {
            return res.status(401).json({
                ok: false,
                msg: 'Usuario o contraseña incorrectos',
                codigo: 401003,
                token: ''
            });
        }

        //Comprobamos que la contrasenya sea igual a la de ese usuario
        const contrasenaValida = bcrypt.compareSync(contrasenya, usuarioBD.data().contrasenya);
        if (!contrasenaValida) {
            return res.status(401).json({
                ok: false,
                msg: 'Usuario o contraseña incorrectos',
                codigo: 401003,
                token: ''
            });
        }

        //Generamos el token de seguridad
        const token = await generarJWT(usuarioBD.id, usuarioBD.data().rol);

        //Si se le pasa el token del dispositivo, se comprueba que el que tenia era distinto entonces, se le actualiza al nuevo
        if(tokenDispositivo && tokenDispositivo!=usuarioBD.data().tokenDispositivo){
            let obj={};
            obj.tokenDispositivo=tokenDispositivo;

            let usuario=await db.collection('usuarios').doc(usuarioBD.id).update(obj);
            usuarioBD.data().tokenDispositivo=tokenDispositivo;
        }


        res.json({
            ok: true,
            msg: 'iniciarSesion',
            codigo: 200000,
            email: usuarioBD.id,
            rol: usuarioBD.data().rol,
            nombre: usuarioBD.data().nombre,
            token,
            suscripcion: usuarioBD.data().suscripcion,
            fechaSuscripcion: usuarioBD.data().fechaSuscripcion,
            tokenDispositivo: usuarioBD.data().tokenDispositivo
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'iniciarSesion',
            codigo: 500,
            token: ''
        });
    }
}

module.exports = { iniciarSesion, token }