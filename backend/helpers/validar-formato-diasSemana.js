
//Funcion que valida el formato del array de diasSemana de los horarios
const validarFormatoArrayDiasSemana = (array) => {
    letras=["L","M","X","J","V","S","D",";"];
    
    for(var i=0; i<array.length; i++){
        if((array[i].length!=1 && array[i].length!=3) || (array[i].length==1 && array[i]==";") || (array[i].length==3 && (array[i][0]==";" || array[i][1]!=";" || array[i][2]==";"))){
            return false;
        }
        for(let j=0;j<array[i].length;j++){
            if(array[i][j]){
                var index = letras.indexOf( array[i][j] );
                if(index==-1){
                    return false;
                }
            }
        }
    }
    return true;
}

module.exports = { validarFormatoArrayDiasSemana }