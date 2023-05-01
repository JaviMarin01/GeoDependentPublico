import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UsuarioService } from './usuario.service';
import { environment } from 'src/environments/environment';
import { timeout, finalize } from 'rxjs';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {

  public mensajeModal = Swal.mixin({
    customClass: {
      confirmButton: 'botonAceptar',
      title: 'tituloModal',
      htmlContainer: 'textoModal'
    },
    buttonsStyling: false,
    heightAuto: false
  })

  constructor(private http: HttpClient, private usuarioService: UsuarioService) { }

  obtenerNotificaciones(){

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.get(`${environment.base_url}/notificacion` , {headers: {'x-token': this.usuarioService.token}})
      .pipe(
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
      })
      );
  }

  leerNotificaciones( dataForm: any) {

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.put(`${environment.base_url}/notificacion/leerNotificaciones` , dataForm, this.cabeceras)
      .pipe(
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
      })
      );
  }

  borrarNotificaciones( dataForm: any) {

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.delete(`${environment.base_url}/notificacion/borrarNotificaciones` , {body: dataForm, headers: {'x-token': this.usuarioService.token}})
      .pipe(
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
      })
      );
  }

  get cabeceras() {
    return {
      headers: {
        'x-token': this.usuarioService.token
      }};
  }

  mostrarModalEspera(){
    this.mensajeModal.fire({
      title: 'Espere',
      text: 'La acción está tardando más de lo habitual.',
      icon: 'warning',
      confirmButtonText: 'Aceptar'
    });
  }
}
