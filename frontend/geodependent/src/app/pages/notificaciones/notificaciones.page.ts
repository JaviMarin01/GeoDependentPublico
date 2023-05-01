import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { NotificacionService } from '../../services/notificacion.service';
import { Notificacion } from '../../models/notificacion.model';
import { UsuarioService } from '../../services/usuario.service';
import { ConexionService } from '../../services/conexion.service';

@Component({
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.page.html',
  styleUrls: ['./notificaciones.page.scss'],
})
export class NotificacionesPage implements OnInit {

  public mensajeModal = Swal.mixin({
    customClass: {
      confirmButton: 'botonAceptar',
      title: 'tituloModal',
      htmlContainer: 'textoModal'
    },
    buttonsStyling: false,
    heightAuto: false
  });

  public notificaciones: Notificacion[]=[];
  public haceTiempo: string[] = [];

  public cargando=false;
  public cargandoLeido=false;
  public cargandoBorrar=false;

  public selecNotifs:string[]=[];

  public subCargar:any;
  public subLeer:any;
  public subBorrar:any;

  constructor(private notificacionService:NotificacionService, private usuarioService:UsuarioService,
              private conexionService: ConexionService) { }

  ngOnInit() {

  }

  ionViewWillEnter() {
    this.cargarNotificaciones();
  }

  ngOnDestroy(){
    if(this.subCargar)
      this.subCargar.unsubscribe();
    if(this.subLeer)
      this.subLeer.unsubscribe();
    if(this.subBorrar)
      this.subBorrar.unsubscribe();
  }

  cargarNotificaciones() {
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.cargando=true;
    this.notificaciones=[];
    this.subCargar=this.notificacionService.obtenerNotificaciones()
      .subscribe( (res:any) => {
        if(res.codigo==200008){
          this.selecNotifs=[];
          this.haceTiempo=[];
          this.notificaciones=res['notificaciones'];

          for(let i=0;i<this.notificaciones.length;i++){
            this.haceXtiempo(this.notificaciones[i].fecha);
          }

          let numLeidos=0;
          for(let i=0;i<this.notificaciones.length;i++){
            if(!this.notificaciones[i].leido){
              numLeidos++;
            }
          }
          if(numLeidos!=this.usuarioService.numNotif.value){
            this.usuarioService.actualizarNumNotif(numLeidos)
          }
        }
        console.log(res);
        this.cargando=false;
      }, (err:any) => {
        this.cargando=false;
        if('name' in err && err.name=="TimeoutError"){
          this.mensajeModal.fire({
            title: 'Error',
            text: 'Se ha excedido el tiempo. Vuelve a intentarlo',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
          return;
        }
        let txt="";
        switch (err.error.codigo) {
          case 400007:                                 //Error obteniendo
          case 500:                                 //Error en el servidor
              txt="Ha ocurrido un error en el servidor. Inténtalo de nuevo más tarde.";
              break;
          default:
              txt="Ha ocurrido un error."
              break;
        }
        if(txt!=""){
          this.mensajeModal.fire({
            title: 'Error',
            text: txt,
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
        console.log(err);
      });
  }

  selNotif(event:any, id:string){
    if(event.detail.checked){
      this.selecNotifs.push(id);
    }else{
      let idx=this.selecNotifs.indexOf(id);
      if(idx!=-1){
        this.selecNotifs.splice(idx,1);
      }
    }
  }

  haceXtiempo(fecha:any) {

    let fec=new Date(fecha._seconds * 1000 + fecha._nanoseconds / 1000000)
    let segundos = Math.floor((new Date().getTime() - new Date(fec).getTime()) / 1000);
    let intervalo = segundos / 31536000;

    let hace="Hace ";

    if (intervalo > 1) {
      hace=hace+Math.floor(intervalo) + " años";
      this.haceTiempo.push(hace);
      return;
    }
    intervalo = segundos / 2592000;
    if (intervalo > 1) {
      hace= hace+Math.floor(intervalo) + " meses";
      this.haceTiempo.push(hace);
      return;
    }
    intervalo = segundos / 86400;
    if (intervalo > 1) {
      hace= hace+Math.floor(intervalo) + " días";
      this.haceTiempo.push(hace);
      return;
    }
    intervalo = segundos / 3600;
    if (intervalo > 1) {
      hace= hace+Math.floor(intervalo) + " horas";
      this.haceTiempo.push(hace);
      return;
    }
    intervalo = segundos / 60;
    if (intervalo > 1) {
      hace= hace+Math.floor(intervalo) + " minutos";
      this.haceTiempo.push(hace);
      return;
    }
    hace= hace+segundos + " segundos";
    this.haceTiempo.push(hace);
    return;
  }

  marcarLeidos(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    if(this.selecNotifs.length==0){
      this.mensajeModal.fire({
        title: 'Cuidado',
        text: 'Debe seleccionar alguna notificación',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    let error=false;
    for(let i=0;i<this.selecNotifs.length && !error;i++){
      let notif=this.notificaciones.find(x => x.id === this.selecNotifs[i]);
      if(!notif || (notif && notif.leido)){
        error=true;
      }
    }

    if(error){
      this.mensajeModal.fire({
        title: 'Cuidado',
        text: 'No puedes marcar como leídas notificaciones ya leídas',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    if(!this.cargandoLeido && !this.cargandoBorrar){
      let data={
        uidNotificaciones:this.selecNotifs
      };
      this.cargandoLeido=true;
      this.subLeer=this.notificacionService.leerNotificaciones(data)
        .subscribe( (res:any) => {
          if(res.codigo==201013){
            this.mensajeModal.fire({
              title: 'Correcto',
              text: 'Notificaciones leídas correctamente',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
            this.notificaciones=[];
            this.selecNotifs=[];
            this.cargarNotificaciones();
          }
          console.log(res);
          this.cargandoLeido=false;
        }, (err:any) => {
          this.cargandoLeido=false;
          if('name' in err && err.name=="TimeoutError"){
            this.mensajeModal.fire({
              title: 'Error',
              text: 'Se ha excedido el tiempo. Vuelve a intentarlo',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
            return;
          }
          let txt="";
          switch (err.error.codigo) {
            case 401012:                                  //La notificacion no te pertenece
            case 401025:                                  //La notificacion ya ha sido leida
              txt=err.error.msg;
              break;
            case 400007:                                 //Error obteniendo
            case 500:                                 //Error en el servidor
                txt="Ha ocurrido un error en el servidor. Inténtalo de nuevo más tarde.";
                break;
            default:
                txt="Ha ocurrido un error."
                break;
          }
          if(txt!=""){
            this.mensajeModal.fire({
              title: 'Error',
              text: txt,
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
          this.notificaciones=[];
          this.selecNotifs=[];
          this.cargarNotificaciones();
          console.log(err);
        });
    }
  }

  borrarNotificaciones(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    if(this.selecNotifs.length==0){
      this.mensajeModal.fire({
        title: 'Cuidado',
        text: 'Debe seleccionar alguna notificación',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    if(!this.cargandoBorrar && !this.cargandoLeido){
      this.cargandoBorrar=true;
      let data={
        uidNotificaciones:this.selecNotifs
      };
      this.subBorrar=this.notificacionService.borrarNotificaciones(data)
        .subscribe( (res:any) => {
          if(res.codigo==200009){
            console.log(res);
            this.mensajeModal.fire({
              title: 'Correcto',
              text: 'Notificaciones borradas correctamente',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
            this.notificaciones=[];
            this.selecNotifs=[];
            this.cargarNotificaciones();
          }
          console.log(res);
          this.cargandoBorrar=false;
        }, (err:any) => {
          this.cargandoBorrar=false;
          if('name' in err && err.name=="TimeoutError"){
            this.mensajeModal.fire({
              title: 'Error',
              text: 'Se ha excedido el tiempo. Vuelve a intentarlo',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
            return;
          }
          let txt="";
          switch (err.error.codigo) {
            case 401012:                                  //La notificacion no te pertenece
                txt=err.error.msg;
                break;
            case 400006:                                 //Error borrando
            case 500:                                 //Error en el servidor
                txt="Ha ocurrido un error en el servidor. Inténtalo de nuevo más tarde.";
                break;
            default:
                txt="Ha ocurrido un error."
                break;
          }
          if(txt!=""){
            this.mensajeModal.fire({
              title: 'Error',
              text: txt,
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
          this.notificaciones=[];
          this.selecNotifs=[];
          this.cargarNotificaciones();
          console.log(err);
        });
    }
  }

  refrescar(event:any){
    if(!this.cargando){
      this.cargarNotificaciones();
    }
    event.target.complete();
  }

  mostrarModalConexion(){
    this.mensajeModal.fire({
      title: 'Conexión',
      text: 'No dispones de conexion a internet en estos momentos. Inténtalo de nuevo más tarde.',
      icon: 'warning',
      confirmButtonText: 'Aceptar'
    });
  }

}
