

//Funcion que comprueba la distancia en metros desde el centro de la zona hasta su posicion (si es mayor que el radio significa que esta fuera, sino dentro)
const distanciaUsuarioCentroZona = (lat1, lon1, lat2, lon2) => {

    var radioTierra = 6371000;

    var dLat = gradosAradianes(lat2-lat1);
    var dLon = gradosAradianes(lon2-lon1);
  
    lat1 = gradosAradianes(lat1);
    lat2 = gradosAradianes(lat2);
  
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  
    return radioTierra * c;

}

function gradosAradianes(degrees) {
    return degrees * Math.PI / 180;
}

module.exports = { distanciaUsuarioCentroZona }