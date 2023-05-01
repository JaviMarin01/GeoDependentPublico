import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { Validators, FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GrupoService } from '../../services/grupo.service';
import { Grupo } from '../../models/grupo.model';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../models/usuario.model';
import { NavController } from '@ionic/angular';
import { ConexionService } from '../../services/conexion.service';

@Component({
  selector: 'app-grupo',
  templateUrl: './grupo.page.html',
  styleUrls: ['./grupo.page.scss'],
})
export class GrupoPage implements OnInit {

  public mensajeModal = Swal.mixin({
    customClass: {
      confirmButton: 'botonAceptar',
      title: 'tituloModal',
      htmlContainer: 'textoModal'
    },
    buttonsStyling: false,
    heightAuto: false
  })

  public usuariosSelecDepen: Usuario[] = [];
  public usuariosSelecCuid : Usuario[]=[];

  public grupo: Grupo=new Grupo("","","", "", [], [], new Date());

  public uid="";

  public grupoForm = this.fb.group({
    nombre: ['', Validators.required]
  },
  {
    updateOn:'submit'
  });

  public cargandoModificar=false;
  public cargandoUsuarios=false;

  public subCargar:any;
  public subUsuarios:any;
  public subModificar:any;

  constructor(private fb:FormBuilder, private grupoService: GrupoService, private route: ActivatedRoute,
              private usuarioService: UsuarioService, private navController: NavController, private conexionService: ConexionService) {
              }

  ngOnInit() {
    this.uid = this.route.snapshot.params['uid'];
  }

  ionViewWillEnter() {
    this.cargarDatos();
    this.cargarUsuarios();
  }

  ngOnDestroy(){
    if(this.subCargar)
      this.subCargar.unsubscribe();
    if(this.subModificar)
      this.subModificar.unsubscribe();
    if(this.subUsuarios)
      this.subUsuarios.unsubscribe();
  }

  cargarDatos() {
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      this.navController.navigateRoot('/cuidador-inicio');
      return;
    }
    if (this.uid !== '') {
      this.subCargar=this.grupoService.obtenerGrupos({id:this.uid})
        .subscribe( (res:any) => {
          if(res.codigo==200002 && res['grupos'].length>0){
            this.grupo=res['grupos'][0];
            this.grupoForm.controls.nombre.setValue(this.grupo.nombre);
          }else{
            this.navController.navigateRoot("/cuidador-inicio");
          }
          console.log(res);
        }, (err:any) => {
          if('name' in err && err.name=="TimeoutError"){
            this.mensajeModal.fire({
              title: 'Error',
              text: 'Se ha excedido el tiempo. Vuelve a intentarlo',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
            this.navController.navigateRoot("/cuidador-inicio");
            return;
          }
          let txt="";
          switch (err.error.codigo) {
            case 400007:                              //Error obteniendo grupo
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

  cargarUsuarios(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      this.navController.navigateRoot('/cuidador-inicio');
      return;
    }
    this.cargandoUsuarios=true;
    this.usuariosSelecCuid=[];
    this.usuariosSelecDepen=[];
    this.subUsuarios=this.usuarioService.obtenerUsuarios({uidGrupo:this.uid})
    .subscribe( (res:any) => {
      if(res.codigo==200001){
        this.usuariosSelecCuid=[];
        this.usuariosSelecDepen=[];
        for(let i=0;i<res['usuarios'].length; i++){
          if(res['usuarios'][i].rol=="ROL_DEPENDIENTE"){
            this.usuariosSelecDepen.push(res['usuarios'][i]);
          }else{
            this.usuariosSelecCuid.push(res['usuarios'][i]);
          }
        }
      }
      console.log(res);
      this.cargandoUsuarios=false;
    }, (err:any) => {
      this.cargandoUsuarios=false;
      if('name' in err && err.name=="TimeoutError"){
        this.mensajeModal.fire({
          title: 'Error',
          text: 'Se ha excedido el tiempo. Vuelve a intentarlo',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
        this.navController.navigateRoot("/cuidador-inicio");
        return;
      }
      let txt="";
      switch (err.error.codigo) {
        case 400007:                              //Error obteniendo usuario
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

  modificarGrupo(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.grupoForm.markAllAsTouched();
    if(this.grupoForm.valid && !this.cargandoModificar && !this.cargandoUsuarios){
      this.cargandoModificar=true;
      let ahora:string[]=[];
      ahora.push(this.usuarioService.email);
      for(let i=0;i<this.usuariosSelecCuid.length;i++){
        ahora.push(this.usuariosSelecCuid[i].email);
      }
      for(let i=0;i<this.usuariosSelecDepen.length;i++){
        ahora.push(this.usuariosSelecDepen[i].email);
      }
      let finalForm = this.fb.group({
        nombre: [this.grupoForm.controls.nombre.value],
        uidUsuariosAntes:[this.grupo.uidUsuarios],
        uidUsuariosAhora:[ahora]
      });
      console.log(finalForm.value);
      this.subModificar=this.grupoService.actualizarGrupo(finalForm.value, this.uid)
        .subscribe((res:any) => {
          if(res.codigo==201004){         //Etapa actualizada
            this.mensajeModal.fire({
              text: 'Grupo modificado correctamente',
              icon: 'success',
              showCloseButton: true,
              showConfirmButton:false
            });
            this.navController.navigateRoot("/cuidador-inicio");
          }
          console.log(res);
          this.cargandoModificar=false;
        }, (err:any) => {
          this.cargandoModificar=false;
          if('name' in err && err.name=="TimeoutError"){
            this.mensajeModal.fire({
              title: 'Error',
              text: 'Se ha excedido el tiempo. Vuelve a intentarlo',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
            this.navController.navigateRoot("/cuidador-inicio");
            return;
          }
          let txt="";
          switch (err.error.codigo) {
            case 401012:                                //El usuario no pertenece al grupo
              txt=err.error.msg;
              this.cargarUsuarios();
              break;
            case 401007:                                //El grupo no existe
            case 401011:                                //No puedes actualizar un grupo no que sea tuyo
              txt=err.error.msg;
              this.navController.navigateRoot("/grupos");
              break;
            case 400005:                              //Error actualizando grupo
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

  borrarUsuario(usu:Usuario){
    let borrado=false;
    for(let i=0;i<this.usuariosSelecCuid.length && !borrado;i++){
      if(this.usuariosSelecCuid[i].email==usu.email){
        this.usuariosSelecCuid.splice(i,1);
        borrado=true;
      }
    }
    for(let i=0;i<this.usuariosSelecDepen.length && !borrado;i++){
      if(this.usuariosSelecDepen[i].email==usu.email){
        this.usuariosSelecDepen.splice(i,1);
        borrado=true;
      }
    }
  }

  volver(){
    this.navController.navigateRoot("/cuidador-inicio");
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
