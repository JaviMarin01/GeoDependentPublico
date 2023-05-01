const { Router } = require('express');
const { iniciarSesion, token} = require('../controllers/auth');
const { check } = require('express-validator');
const { validarCampos } = require('../middleware/validar-campos');
const { validarJWT } = require('../middleware/validar-jwt');

const router = Router();

//Todas las rutas de Auth

router.get('/token', [
    validarJWT,
    check('x-token', 'El argumento x-token es obligatorio').not().isEmpty(),
    validarCampos,
], token);

router.post('/', [
    check('contrasenya', 'El argumento contrasenya es obligatorio').not().isEmpty(),
    check('email', 'El argumento email es obligatorio').not().isEmpty(),
    check('hashLogin', 'El argumento hashLogin es obligatorio').not().isEmpty(),

    check('contrasenya', 'El argumento contrasenya debe ser un string').isString(),
    check('email', 'El argumento email debe ser un string').isString(),
    check('hashLogin', 'El argumento hashLogin debe ser un string').isString(),
    validarCampos,
], iniciarSesion);


module.exports = router;