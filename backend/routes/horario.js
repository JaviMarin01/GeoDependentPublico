const { Router } = require('express');
const { obtenerHorarios, crearHorario, actualizarHorario, eliminarHorario } = require('../controllers/horario');
const { check } = require('express-validator');
const { validarCampos } = require('../middleware/validar-campos');
const { validarJWT } = require('../middleware/validar-jwt');

const router = Router();

//Todas las rutas de Horario

router.get('/', [
    validarJWT,
], obtenerHorarios);

router.post('/', [
    validarJWT,
    check('uidUsuarios', 'El argumento uidUsuarios es obligatorio').not().isEmpty(),
    check('uidZona', 'El argumento uidZona no puede estar vacío').not().isEmpty(),
    check('diasSemana', 'El argumento diasSemana no puede estar vacío').not().isEmpty(),
    check('horas', 'El argumento horas no puede estar vacío').not().isEmpty(),

    check('uidUsuarios', 'El argumento uidUsuarios debe ser un array').isArray(),
    check('uidZona', 'El argumento uidZona debe ser un string').isString(),
    check('diasSemana', 'El argumento diasSemana debe ser un array').isArray(),
    check('horas', 'El argumento horas debe ser un array').isArray(),

    validarCampos,
], crearHorario);

router.put('/:id', [
    validarJWT,
    check('id', 'El identificador es obligatorio').not().isEmpty(),
    check('uidUsuarios', 'El argumento uidUsuarios es obligatorio').not().isEmpty(),
    check('uidZona', 'El argumento uidZona no puede estar vacío').not().isEmpty(),
    check('diasSemana', 'El argumento diasSemana no puede estar vacío').not().isEmpty(),
    check('horas', 'El argumento horas no puede estar vacío').not().isEmpty(),

    check('uidUsuarios', 'El argumento uidUsuarios debe ser un array').isArray(),
    check('uidZona', 'El argumento uidZona debe ser un string').isString(),
    check('diasSemana', 'El argumento diasSemana debe ser un array').isArray(),
    check('horas', 'El argumento horas debe ser un array').isArray(),

    validarCampos,
], actualizarHorario);

router.delete('/:id', [
    validarJWT,
    check('id', 'El identificador es obligatorio').not().isEmpty(),
    validarCampos
], eliminarHorario);


module.exports = router;