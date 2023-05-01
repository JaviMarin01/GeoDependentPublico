const { response } = require('express');
const { validationResult } = require('express-validator');

//Funcion que valida si los campos obligatorios no lo son o si tienen que ser de un formato no lo son
const validarCampos = (req, res = response, next) => {
    const erroresVal = validationResult(req);

    if (!erroresVal.isEmpty()) {
        return res.status(400).json({
            ok: false,
            msg: 'Argumentos recibidos inválidos',
            codigo: 400012,
            errores: erroresVal.mapped()
        });
    }
    next();

}

module.exports = { validarCampos }