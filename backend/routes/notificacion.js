const { Router } = require('express');
const { obtenerNotificaciones, leerNotificaciones, borrarNotificaciones } = require('../controllers/notificacion');
const { check } = require('express-validator');
const { validarCampos } = require('../middleware/validar-campos');
const { validarJWT } = require('../middleware/validar-jwt');

const router = Router();

//Todas las rutas de Notificacion

router.get('/', [
    validarJWT,
], obtenerNotificaciones);

router.put('/leerNotificaciones', [
    validarJWT,

    check('uidNotificaciones', 'El argumento uidNotificaciones es obligatorio').exists(),

    check('uidNotificaciones', 'El argumento uidNotificaciones debe ser un array').isArray(),

    validarCampos,
], leerNotificaciones);

router.delete('/borrarNotificaciones', [
    validarJWT,

    check('uidNotificaciones', 'El argumento uidNotificaciones es obligatorio').exists(),

    check('uidNotificaciones', 'El argumento uidNotificaciones debe ser un array').isArray(),

    validarCampos,
], borrarNotificaciones);


module.exports = router;