import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Usuario } from '../models/usuario.model';
import { BehaviorSubject, catchError, map, Observable, of, tap, timeout, finalize } from 'rxjs';
import { Storage } from '@ionic/storage';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  public mensajeModal = Swal.mixin({
    customClass: {
      confirmButton: 'botonAceptar',
      title: 'tituloModal',
      htmlContainer: 'textoModal'
    },
    buttonsStyling: false,
    heightAuto: false
  });

  private usuario: Usuario = new Usuario("","","","");
  public t="";
  public accion: string = "";
  public notif:any;
  public tokenDisp="";

  public numNotif= new BehaviorSubject(0);
  public nuevoNumNotif=false;
  public logueado=false;

  constructor( private http: HttpClient, private storage: Storage  ) {
      localStorage.setItem("token","");
    }


    actualizarNumNotif(num:number){
      this.nuevoNumNotif=true;
      this.numNotif.next(num);
    }


  obtenerUsuarios(obj:any){
    let params = new HttpParams();
    if (obj.hasOwnProperty('uidGrupo')) params = params.append('uidGrupo', obj.uidGrupo);

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.get(`${environment.base_url}/usuario` , {params:params, headers: {'x-token': this.usuario.token}})
      .pipe(
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
      })
      );
  }

  crearUsuario ( formData: any) {

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.post(`${environment.base_url}/usuario`, formData)
      .pipe(
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
      })
      );
  }

  actualizarUsuario (data: any) {

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.put(`${environment.base_url}/usuario`, data, this.cabeceras)
      .pipe(
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
      })
      );
  }

  cambiarContrasenya (data: any) {

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.put(`${environment.base_url}/usuario/nc`, data, this.cabeceras)
      .pipe(
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
      })
      );
  }

  suscribirse( data: any) {

    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.put(`${environment.base_url}/usuario/actualizarPago` , data,  this.cabeceras)
      .pipe(
        tap( (res : any) => {
          if('codigo' in res && res.codigo==201012){
            this.usuario.fechaSuscripcion=new Date(res.fechaSuscripcion);
            this.usuario.suscripcion=res.suscripcion;
          }
        }),
        timeout(30000), // tiempo límite de 30 segundos
        finalize(() => {
          // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
          clearTimeout(timeoutModal);
        })
      );
  }

  login( formData: any) {
    let timeoutModal = setTimeout(() => {
      // mostrar el modal si la respuesta no ha llegado después de 5 segundos
      this.mostrarModalEspera();
    }, 5000);

    return this.http.post(`${environment.base_url}/login`, formData)
    .pipe(
      tap( (res : any) => {
        const {email, rol, nombre, token, suscripcion, fechaSuscripcion} = res;
        this.usuario = new Usuario(email, rol, token, nombre, suscripcion, "", fechaSuscripcion);
        console.log(this.usuario);
        localStorage.setItem('token', token);
        this.storage.set("token",token);
      }),
      timeout(30000), // tiempo límite de 30 segundos
      finalize(() => {
        // limpiar el temporizador del modal si la respuesta llega antes de los 5 segundos
        clearTimeout(timeoutModal);
      })
    );
  }

  async limpiarLocalStore(){
    localStorage.removeItem('token');
    await this.storage.remove('token');
    await this.storage.remove('idGrupoActual');
    await this.storage.remove('grupoActual');
  }

  logout(): void {
    this.usuario = new Usuario("", "", "", "");
    this.usuario.rol="";

    this.limpiarLocalStore();
    this.numNotif.next(0);
  }

  validar(correcto: boolean, incorrecto: boolean): Observable<boolean> {

    if (this.token === '') {
      this.limpiarLocalStore();
      return of(incorrecto);
    }

    return this.http.get(`${environment.base_url}/login/token`, this.cabeceras)
      .pipe(
        tap( (res: any) => {
          // extaemos los datos que nos ha devuelto y los guardamos en el usurio y en localstore
          const { email, rol, nombre, token, suscripcion, fechaSuscripcion} = res;
          this.usuario = new Usuario(email, rol, token, nombre, suscripcion, "", new Date(fechaSuscripcion._seconds * 1000 + fechaSuscripcion._nanoseconds / 1000000));
          localStorage.setItem('token', token);
          this.storage.set('token', token);
        }),
        map ( res => {
          return correcto;
        }),
        catchError ( err => {
          this.limpiarLocalStore();
          return of(incorrecto);
        })
      );
  }

  async validarInicial(): Promise<boolean> {

    if (this.token === '') {
      this.limpiarLocalStore();
      this.logueado=false;
      return false;
    }

    try {
      const res: any = await this.http.get(`${environment.base_url}/login/token`, this.cabeceras).toPromise();
      const { email, rol, nombre, token, suscripcion, fechaSuscripcion} = res;
      this.usuario = new Usuario(email, rol, token, nombre, suscripcion, "", new Date(fechaSuscripcion._seconds * 1000 + fechaSuscripcion._nanoseconds / 1000000));
      localStorage.setItem('token', token);
      this.storage.set('token', token);
      this.logueado=true;
      return true;
    } catch (err) {
      this.limpiarLocalStore();
      this.logueado=false;
      return false;
    }
  }

  validarToken(): Observable<boolean> {
    return this.validar(true, false);
  }

  validarNoToken(): Observable<boolean> {
    return this.validar(false, true);
  }

  get cabeceras() {
    return {
      headers: {
      'x-token': this.token
    }};
  }

  setToken(token:string){
    this.usuario.token=token;
    if(token!=""){
      this.validarToken();
    }
  }

  async getToken(){
    let token=await this.storage.get("token");
    this.usuario.token=token;
  }

  get token(): string {

    if(this.usuario.token!=""){
      return this.usuario.token;
    }else if(localStorage.getItem('token')!=""){
      return localStorage.getItem('token') || '';
    }
    return '';
  }

  get rol(): string {
    if(this.usuario.rol!=""){
      return this.usuario.rol;
    }
    return '';
  }

  get email(): string {
    if(this.usuario.email!=""){
      return this.usuario.email;
    }
    return '';
  }

  get nombre(): string {
    if(this.usuario.nombre && this.usuario.nombre!=""){
      return this.usuario.nombre;
    }
    return '';
  }

  get suscripcion(): boolean {
    if(this.usuario.suscripcion)
    return this.usuario.suscripcion;
    else return false;
  }

  get fechaSuscripcion(): Date {
    if(this.usuario.fechaSuscripcion){
      return this.usuario.fechaSuscripcion;
    }
    return new Date();
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
