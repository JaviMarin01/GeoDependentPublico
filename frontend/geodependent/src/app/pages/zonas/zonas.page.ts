import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import Swal from 'sweetalert2';
import { ZonaService } from '../../services/zona.service';
import { Zona } from '../../models/zona.model';
import { GrupoService } from '../../services/grupo.service';
import { Grupo } from '../../models/grupo.model';
import { ConexionService } from '../../services/conexion.service';

@Component({
  selector: 'app-zonas',
  templateUrl: './zonas.page.html',
  styleUrls: ['./zonas.page.scss'],
})
export class ZonasPage implements OnInit {

  public mensajeModal = Swal.mixin({
    customClass: {
      confirmButton: 'botonAceptar',
      title: 'tituloModal',
      htmlContainer: 'textoModal'
    },
    buttonsStyling: false,
    heightAuto: false
  });

  public uidGrupo="";

  public cargando=true;
  public cargandoBorrar=false;

  public sel="";

  public zonas: Zona[]=[];
  public grupo: Grupo = new Grupo("","","", "", [], [], new Date());
  public sinGrupo=false;

  public subCargar:any;
  public subBorrar:any;

  constructor(private zonaService: ZonaService, private grupoService: GrupoService, private navController: NavController,
              private conexionService: ConexionService) {
     }

  ngOnInit() {
  }

  ionViewWillEnter() {
    if(this.grupoService.idGrupoActual!=""){   //Si ha seleccionado un grupo cargamos la info
      this.cargarDatos();
      this.grupo=this.grupoService.objetoGrupoActual;
      this.sinGrupo=false;
    }else{
      this.grupo = new Grupo("","","", "", [], [], new Date());
      this.sinGrupo=true;
    }
  }

  ngOnDestroy(){
    if(this.subCargar)
      this.subCargar.unsubscribe();
    if(this.subBorrar)
      this.subBorrar.unsubscribe();
  }


  cargarDatos() {
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
      this.cargando=true;
      this.zonas=[];
      this.subCargar=this.zonaService.obtenerZonas({uidGrupo:this.grupoService.idGrupoActual})
        .subscribe( (res:any) => {
          if(res.codigo==200004){
            this.zonas=res['zonas'];
            this.cargando=false;
          }
          console.log(res);
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
          if(err.error.codigo==500){    //Error en el servidor
            this.mensajeModal.fire({
              title: 'Error',
              text: 'Ha ocurrido un error en el servidor. Inténtalo de nuevo más tarde.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }else if(err.error.codigo==400007){    //uid de la url incorrecta o no tiene permiso para obtener ese grupo
            this.navController.navigateRoot("/cuidador-inicio");
          }
          console.log(err);
        });
  }

  refrescar(event:any){
    if(!this.cargando && !this.cargandoBorrar){
      this.cargarDatos();
    }
    event.target.complete();
  }

  borrarZona(id:string, i:number) {
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    if(!this.cargandoBorrar){
      this.cargandoBorrar=true;
      this.sel=id;
      this.subBorrar=this.zonaService.borrarZona(id)
      .subscribe((res:any)=>{
        if(res.codigo==200005){
          this.mensajeModal.fire({
            text: 'Zona eliminada correctamente',
            icon: 'success',
            showCloseButton: true,
            showConfirmButton:false
          });
          this.zonas.splice(i,1);
          this.cargandoBorrar=false;
          this.sel="";
        }
        console.log(res);
      }, (err:any) => {
        this.cargandoBorrar=false;
        this.sel="";
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
          case 401012:                                //La zona no te pertenece
          case 401008:                                //La zona no existe
          case 401007:                                //El grupo no existe
            txt=err.error.msg;
            this.zonas.splice(i,1);
            break;
          case 400006:                              //Error borrando
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
