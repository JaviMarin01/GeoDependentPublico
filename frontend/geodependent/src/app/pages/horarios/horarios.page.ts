import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { HorarioService } from '../../services/horario.service';
import { UsuarioService } from '../../services/usuario.service';
import { GrupoService } from '../../services/grupo.service';
import { Grupo } from '../../models/grupo.model';
import { Horario } from '../../models/horario.model';
import { Zona } from '../../models/zona.model';
import { Usuario } from '../../models/usuario.model';
import { ZonaService } from '../../services/zona.service';
import { ConexionService } from '../../services/conexion.service';


@Component({
  selector: 'app-horarios',
  templateUrl: './horarios.page.html',
  styleUrls: ['./horarios.page.scss'],
})
export class HorariosPage implements OnInit {

  public mensajeModal = Swal.mixin({
    customClass: {
      confirmButton: 'botonAceptar',
      title: 'tituloModal',
      htmlContainer: 'textoModal'
    },
    buttonsStyling: false,
    heightAuto: false
  })

  public cargando=true;
  public cargandoUsuarios=false;
  public cargandoZonas=false;
  public cargandoBorrar=false;

  public sel="";

  public subHorarios:any;
  public subZonas:any;
  public subUsuarios:any;
  public subBorrar:any;

  public horarios: Horario[]=[];
  public grupo: Grupo = new Grupo("","","", "", [], [], new Date());
  public zonas: Zona[] = [];
  public zonasUsu: string[]=[];
  public zonasFinal: Zona[] =[];
  public usuarios: string[][] = [];
  public sinGrupo=false;
  public users : Usuario[] = [];

  constructor(private usuarioService: UsuarioService, private horarioService: HorarioService,
    private grupoService: GrupoService, private zonaService: ZonaService,
    private conexionService: ConexionService) {}

  ngOnInit() {

  }

  ionViewWillEnter() {
    if(this.grupoService.idGrupoActual!=""){   //Si ha seleccionado un grupo cargamos la info
      this.cargarDatos();
      this.grupo=this.grupoService.objetoGrupoActual;
      this.sinGrupo=false;
      this.usuarios=[];
    }else{
      this.grupo = new Grupo("","","", "", [], [], new Date());
      this.sinGrupo=true;
      this.usuarios=[];
    }
  }

  ngOnDestroy(){
    if(this.subHorarios)
      this.subHorarios.unsubscribe();
    if(this.subZonas)
      this.subZonas.unsubscribe();
    if(this.subUsuarios)
      this.subUsuarios.unsubscribe();
    if(this.subBorrar)
      this.subBorrar.unsubscribe();
  }


  cargarDatos() {
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.cargando=true;
    this.horarios=[];
    this.subHorarios=this.horarioService.obtenerHorarios({uidGrupo:this.grupoService.idGrupoActual})
      .subscribe( (res:any) => {
        if(res.codigo==200006){
          this.cargando=false;
          this.horarios=res['horarios'];
          this.zonasUsu=[];
          for(let i=0;i<this.horarios.length;i++){
            this.zonasUsu.push(res['horarios'][i].uidZona);
          }
          this.cargarUsuarios();
          this.cargarZonas();
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
        if(err.error.codigo==500 || err.error.codigo==400007){    //Error en el servidor
          this.mensajeModal.fire({
            title: 'Error',
            text: 'Ha ocurrido un error en el servidor. Inténtalo de nuevo más tarde.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
        console.log(err);
      });
  }

  cargarZonas(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.cargandoZonas=true;
    this.zonas=[];
    this.subZonas=this.zonaService.obtenerZonas({uidGrupo:this.grupoService.idGrupoActual})
      .subscribe( (res:any) => {
        if(res.codigo==200004){
          this.cargandoZonas=false;
          this.zonas=res['zonas'];
          this.zonasFinal=[];
          for(let i=0;i<this.zonasUsu.length;i++){
            let zon=this.zonas.find(x=>x.id==this.zonasUsu[i]);
            if(zon){
              this.zonasFinal.push(zon);
            }
          }
        }
        console.log(res);
      }, (err:any) => {
        this.cargandoZonas=false;
        if('name' in err && err.name=="TimeoutError"){
          this.mensajeModal.fire({
            title: 'Error',
            text: 'Se ha excedido el tiempo. Vuelve a intentarlo',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
          return;
        }
        if(err.error.codigo==500 || err.error.codigo==400007){    //Error en el servidor
          this.mensajeModal.fire({
            title: 'Error',
            text: 'Ha ocurrido un error en el servidor. Inténtalo de nuevo más tarde.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
        console.log(err);
      });
  }

  mostrarModalEspera(){
    this.mensajeModal.fire({
      title: 'Espera',
      text: 'Espere. La acción está tardando más de lo habitual.',
      icon: 'warning',
      confirmButtonText: 'Aceptar'
    });
  }

  cargarUsuarios(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.cargandoUsuarios=true;
    this.users=[];
    this.usuarios=[];
    this.subUsuarios=this.usuarioService.obtenerUsuarios({uidGrupo:this.grupo.id})
    .subscribe( (res:any) => {
      if(res.codigo==200001){
        this.cargandoUsuarios=false;
        this.users=res['usuarios'];
        for(let i=0;i<this.horarios.length;i++){
          let us:string[]=[];
          for(let j=0;j<this.horarios[i].uidUsuarios.length;j++){
            let usu=this.users.find(x=>x.email == this.horarios[i].uidUsuarios[j]);
            if(usu){
              us.push(String(usu.nombre));
            }
          }
          this.usuarios.push(us);
        }
      }
      console.log(res);
    }, (err:any) => {
      this.cargandoUsuarios=false;
      if('name' in err && err.name=="TimeoutError"){
        this.mensajeModal.fire({
          title: 'Error',
          text: 'Se ha excedido el tiempo. Vuelve a intentarlo',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
        return;
      }
      if(err.error.codigo==500 || err.error.codigo==400007){    //Error en el servidor
        this.mensajeModal.fire({
          title: 'Error',
          text: 'Ha ocurrido un error en el servidor. Inténtalo de nuevo más tarde.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
      console.log(err);
    });
  }

  borrarHorario(id:string, i:number) {
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    if(!this.cargandoBorrar){
      this.cargandoBorrar=true;
      this.sel=id;
      this.subBorrar=this.horarioService.borrarHorario(id)
      .subscribe((res:any)=>{
        if(res.codigo==200007){
          this.mensajeModal.fire({
            text: 'Horario eliminado correctamente',
            icon: 'success',
            showCloseButton: true,
            showConfirmButton:false
          });
          this.horarios.splice(i,1);
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
          case 401012:                                //El horario no te pertenece
          case 401010:                                //El horario no existe
          case 401008:                                //La zona no existe
          case 401007:                                //El grupo no existe
            txt=err.error.msg;
            this.horarios.splice(i,1);
            this.zonas.splice(i,1);
            break;
          case 400006:                              //Error borrando grupo
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

  refrescar(event:any){
    if(!this.cargando && !this.cargandoUsuarios && !this.cargandoZonas){
      this.cargarDatos();
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
