const { Router } = require('express');
const { obtenerUsuarios, crearUsuario, actualizarUsuario, actualizarContrasenya, actualizarEstadoPago } = require('../controllers/usuario');
const { check } = require('express-validator');
const { validarCampos } = require('../middleware/validar-campos');
const { validarJWT } = require('../middleware/validar-jwt');
const { validarRol } = require('../middleware/validar-rol');

const router = Router();

//Todas las rutas de Usuario

router.get('/', [
    validarJWT,
    validarCampos,
], obtenerUsuarios);

router.post('/', [
    check('email', 'El argumento email es obligatorio').not().isEmpty(),
    check('contrasenya', 'El argumento contrasena es obligatorio').not().isEmpty(),
    check('nombre', 'El argumento nombre es obligatorio').not().isEmpty(),
    check('rol', 'El campo rol es obligatorio').not().isEmpty(),

    check('email', 'El argumento email debe ser un string').isString(),
    check('contrasenya', 'El argumento contrasena debe ser un string').isString(),
    check('nombre', 'El argumento nombre debe ser un string').isString(),
    check('rol', 'El campo rol debe ser un string').isString(),

    validarCampos,
    validarRol,
], crearUsuario);

router.put('/nc', [
    validarJWT,
    check('contrasenya', 'El argumento contrasenya es obligatorio').not().isEmpty(),
    check('nuevaContrasenya', 'El argumento nuevaContrasenya es obligatorio').not().isEmpty(),

    check('contrasenya', 'El argumento contrasenya debe ser un string').isString(),
    check('nuevaContrasenya', 'El argumento nuevaContrasenya debe ser un string').isString(),

    validarCampos
], actualizarContrasenya);

router.put('/actualizarPago', [
    validarJWT,
    check('suscripcion', 'El argumento suscripcion es obligatorio').not().isEmpty(),

    check('tokenTarjeta', 'El argumento tokenTarjeta debe ser un string').optional().isString(),
    validarCampos,
], actualizarEstadoPago);

router.put('/', [
    validarJWT,
    //opcionales
    check('nombre', 'El argumento nombre debe ser un string').optional().isString(),
    check('posicion', 'El argumento posicion debe ser un string').optional().isString(),
    check('tokenDispositivo', 'El tokenDispositivo debe ser un string').optional().isString(),

    validarCampos,
], actualizarUsuario);


module.exports = router;