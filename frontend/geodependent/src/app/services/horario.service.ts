import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UsuarioService } from './usuario.service';
import { environment } from 'src/environments/environment';
import { finalize, timeout } from 'rxjs';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class HorarioService {

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

  obtenerHorarios(obj:any){
    let params = new HttpParams();
    if (obj.hasOwnProperty('id')) params = params.append('id', obj.id);
    if (obj.hasOwnProperty('uidZona')) params = params.append('uidZona', obj.uidZona);
    if (obj.hasOwnProperty('uidGrupo')) params = params.append('uidGrupo', obj.uidGrupo);

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.get(`${environment.base_url}/horario` , {params:params, headers: {'x-token': this.usuarioService.token}})
      .pipe(
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
      })
      );
  }

  crearHorario( dataForm: any) {

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.post(`${environment.base_url}/horario` , dataForm, this.cabeceras)
      .pipe(
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
      })
      );
  }

  actualizarHorario( dataForm: any, uid:string) {
    if (!uid) { uid = '';}

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.put(`${environment.base_url}/horario/${uid}` , dataForm, this.cabeceras)
      .pipe(
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
      })
      );
  }

  borrarHorario( uid: string) {
    if (!uid) { uid = '';}

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.delete(`${environment.base_url}/horario/${uid}` , this.cabeceras)
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
