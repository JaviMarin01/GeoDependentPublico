const { Router } = require('express');
const { obtenerGrupos, crearGrupo, actualizarGrupo, unirseGrupo, recibirNotificaciones, salirGrupo, eliminarGrupo } = require('../controllers/grupo');
const { check } = require('express-validator');
const { validarCampos } = require('../middleware/validar-campos');
const { validarJWT } = require('../middleware/validar-jwt');

const router = Router();

//Todas las rutas de Grupo

router.get('/', [
    validarJWT,
], obtenerGrupos);

router.post('/', [
    validarJWT,
    check('nombre', 'El argumento nombre es obligatorio').not().isEmpty(),

    check('nombre', 'El argumento nombre debe ser un string').isString(),

    validarCampos,
], crearGrupo);

router.put('/unirse', [
    validarJWT,
    check('codigo', 'El argumento codigo es obligatorio').not().isEmpty(),

    check('codigo', 'El argumento codigo debe ser un string').isString(),

    validarCampos,
], unirseGrupo);

router.put('/notificaciones', [
    validarJWT,
    check('notificacion', 'El argumento notificacion es obligatorio').not().isEmpty(),
    check('uidGrupo', 'El argumento uidGrupo es obligatorio').not().isEmpty(),

    check('notificacion', 'El argumento notificacion debe ser un boolean').isBoolean(),
    check('uidGrupo', 'El argumento uidGrupo debe ser un string').isString(),

    validarCampos,
], recibirNotificaciones);

router.put('/salir', [
    validarJWT,
    
    check('uidGrupo', 'El argumento uidGrupo es obligatorio').not().isEmpty(),

    check('uidGrupo', 'El argumento uidGrupo debe ser un string').isString(),

    validarCampos,
], salirGrupo);

router.put('/:id', [
    validarJWT,
    check('id', 'El identificador es obligatorio').not().isEmpty(),
    check('nombre', 'El argumento nombre es obligatorio').not().isEmpty(),
    check('uidUsuariosAntes', 'El argumento uidUsuariosAntes es obligatorio').exists(),
    check('uidUsuariosAhora', 'El argumento uidUsuariosAhora es obligatorio').exists(),

    check('nombre', 'El argumento nombre debe ser un string').isString(),
    check('uidUsuariosAntes', 'El argumento uidUsuariosAntes debe ser un array').isArray(),
    check('uidUsuariosAhora', 'El argumento uidUsuariosAhora debe ser un array').isArray(),
    
    validarCampos,
], actualizarGrupo);

router.delete('/:id', [
    validarJWT,
    check('id', 'El identificador es obligatorio').not().isEmpty(),
    validarCampos
], eliminarGrupo);


module.exports = router;