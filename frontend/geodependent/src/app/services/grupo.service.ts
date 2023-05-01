import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UsuarioService } from './usuario.service';
import { environment } from 'src/environments/environment';
import { Grupo } from '../models/grupo.model';
import { timeout, finalize } from 'rxjs';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class GrupoService {

  public mensajeModal = Swal.mixin({
    customClass: {
      confirmButton: 'botonAceptar',
      title: 'tituloModal',
      htmlContainer: 'textoModal'
    },
    buttonsStyling: false,
    heightAuto: false
  })

  public idGrupoActual="";
  public objetoGrupoActual : Grupo = new Grupo("","","", "", [], [], new Date());

  constructor(private http: HttpClient, private usuarioService: UsuarioService) { }

  obtenerGrupos(obj:any){
    let params = new HttpParams();
    if (obj.hasOwnProperty('id')) params = params.append('id', obj.id);
    if (obj.hasOwnProperty('uidUsuario')) params = params.append('uidUsuario', obj.uidUsuario);

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.get(`${environment.base_url}/grupo` , {params:params, headers: {'x-token': this.usuarioService.token}})
      .pipe(
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
      })
      );
  }

  crearGrupo( dataForm: any) {

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.post(`${environment.base_url}/grupo` , dataForm, this.cabeceras)
      .pipe(
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
      })
      );
  }

  actualizarGrupo( dataForm: any, uid:string) {
    if (!uid) { uid = '';}

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.put(`${environment.base_url}/grupo/${uid}` , dataForm, this.cabeceras)
      .pipe(
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
      })
      );
  }

  unirseAGrupo(dataform: any){

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.put(`${environment.base_url}/grupo/unirse` , dataform, this.cabeceras)
      .pipe(
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
      })
      );
  }

  salirseGrupo(dataform: any){

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.put(`${environment.base_url}/grupo/salir` ,dataform, this.cabeceras)
      .pipe(
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
      })
      );
  }

  recibirNotificaciones(dataform: any){

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.put(`${environment.base_url}/grupo/notificaciones` , dataform, this.cabeceras)
      .pipe(
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
      })
      );
  }

  borrarGrupo( uid: string) {
    if (!uid) { uid = '';}

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.delete(`${environment.base_url}/grupo/${uid}` , this.cabeceras)
      .pipe(
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
      })
      );
  }

  setIdGrupoActual(id:string){
    this.idGrupoActual=id;
  }

  setNombreGrupoActual(nombre:string){
    this.objetoGrupoActual.nombre=nombre;
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
