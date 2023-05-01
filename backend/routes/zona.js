const { Router } = require('express');
const { obtenerZonas, crearZona, actualizarZona, eliminarZona } = require('../controllers/zona');
const { check } = require('express-validator');
const { validarCampos } = require('../middleware/validar-campos');
const { validarJWT } = require('../middleware/validar-jwt');

const router = Router();

//Todas las rutas de Zona

router.get('/', [
    validarJWT,
], obtenerZonas);

router.post('/', [
    validarJWT,
    check('nombre', 'El argumento nombre es obligatorio').not().isEmpty(),
    check('tipo', 'El argumento tipo es obligatorio').not().isEmpty(),
    check('radio', 'El argumento radio es obligatorio').not().isEmpty(),
    check('posicion', 'El argumento posicion es obligatorio').not().isEmpty(),
    check('uidGrupo', 'El argumento uidGrupo es obligatorio').not().isEmpty(),

    check('nombre', 'El argumento nombre debe ser un string').isString(),
    check('tipo', 'El argumento tipo debe ser un string').isString(),
    check('radio', 'El argumento radio debe ser un numero').isInt(),
    check('posicion', 'El argumento posicion debe ser un string').isString(),
    check('uidGrupo', 'El argumento uidGrupo debe ser un string').isString(),

    check('radio', 'El argumento radio debe estar entre 100 y 500').isInt({ min: 100, max: 500 }),

    validarCampos,
], crearZona);

router.put('/:id', [
    validarJWT,
    check('id', 'El identificador es obligatorio').not().isEmpty(),
    check('nombre', 'El argumento nombre es obligatorio').not().isEmpty(),
    check('tipo', 'El argumento tipo no puede estar vacío').not().isEmpty(),
    check('radio', 'El argumento radio no puede estar vacío').not().isEmpty(),
    check('posicion', 'El argumento posicion no puede estar vacío').not().isEmpty(),

    check('nombre', 'El argumento nombre debe ser un string').isString(),
    check('tipo', 'El argumento tipo debe ser un string').isString(),
    check('radio', 'El argumento radio debe ser un numero').isInt(),
    check('posicion', 'El argumento posicion debe ser un string').isString(),

    check('radio', 'El argumento radio debe estar entre 100 y 500').isInt({ min: 100, max: 500 }),

    validarCampos,
], actualizarZona);

router.delete('/:id', [
    validarJWT,
    check('id', 'El identificador es obligatorio').not().isEmpty(),
    validarCampos
], eliminarZona);


module.exports = router;