import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { FormBuilder, Validators } from '@angular/forms';
import { matchValidator } from 'src/app/helpers/contrasena-validacion';
import { UsuarioService } from '../../services/usuario.service';
import { GrupoService } from '../../services/grupo.service';
import { NavController } from '@ionic/angular';
import { ConexionService } from '../../services/conexion.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage implements OnInit {

  public mensajeModal = Swal.mixin({
    customClass: {
      confirmButton: 'botonAceptar',
      title: 'tituloModal',
      htmlContainer: 'textoModal'
    },
    buttonsStyling: false,
    heightAuto: false
  })

  public nombreForm = this.fb.group({
    nombre: ['', Validators.required]
  },
  {
    updateOn: 'submit'
  });

  public errorContIncorrecta=false;
  public errorContIgual=false;
  public errorContIgualEmail=false;

  public contrasenyaForm = this.fb.group({
    contrasenyaActual: ['', Validators.required],
    contrasenya: ['', [Validators.required, Validators.pattern("^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,32}$"),matchValidator('repetirContrasenya', true)] ],
    repetirContrasenya: ['', [Validators.required, matchValidator('contrasenya')]],
  },
  {
    updateOn: 'submit'
  });

  public cargandoNombre=false;
  public cargandoCont=false;
  public cargandoLogout=false;
  public cargandoUsu=false;

  public subCargar:any;
  public subNombre:any;
  public subContrasena:any;

  constructor(private fb:FormBuilder, private usuarioService: UsuarioService, private grupoService: GrupoService,
              private navController: NavController, private conexionService: ConexionService) {
   }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.cargarDatos();
  }

  ngOnDestroy(){
    if(this.subCargar)
      this.subCargar.unsubscribe();
    if(this.subNombre)
      this.subNombre.unsubscribe();
    if(this.subContrasena)
      this.subContrasena.unsubscribe();
  }

  cargarDatos() {
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      this.navController.navigateRoot("/cuidador-inicio");
      return;
    }
    this.cargandoUsu=true;
    this.subCargar=this.usuarioService.validarToken()
      .subscribe( (res:any) => {
        if(res){
          console.log(res);
          this.nombreForm.controls.nombre.setValue(this.usuarioService.nombre);
        }
        this.cargandoUsu=false;
        console.log(res);
      }, (err:any) => {
        this.cargandoUsu=false;
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
          case 401002:                                 //Usuario no existe
            txt=err.error.msg;
            this.usuarioService.logout();
            break;
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

  modificarNombre(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.nombreForm.markAllAsTouched();
    if (this.nombreForm.valid && !this.cargandoNombre && !this.cargandoCont && !this.cargandoLogout) {
      this.cargandoNombre=true;
      this.subNombre=this.usuarioService.actualizarUsuario(this.nombreForm.value)
      .subscribe( (res:any) => {
        if(res.codigo==201001){     //Usuario modificado
          this.mensajeModal.fire({
            text: 'Nombre modificado correctamente',
            icon: 'success',
            showCloseButton: true,
            showConfirmButton:false
          });
        }
        console.log(res);
        this.cargandoNombre=false;
      }, (err:any) => {
        this.cargandoNombre=false;
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
          case 401002:                                 //Usuario no existe
              txt=err.error.msg;
              this.usuarioService.logout();
              break;
          case 400005:                                 //Error actualizando
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

  modificarContrasenya(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.contrasenyaForm.markAllAsTouched();
    if (this.contrasenyaForm.valid && !this.cargandoCont && !this.cargandoNombre && !this.cargandoLogout) {
      this.cargandoCont=true;
      let finalForm = this.fb.group({
        contrasenya: [this.contrasenyaForm.controls.contrasenyaActual.value],
        nuevaContrasenya:[this.contrasenyaForm.controls.contrasenya.value]
      });
      this.subContrasena=this.usuarioService.cambiarContrasenya(finalForm.value)
      .subscribe( (res:any) => {
        if(res.codigo==201011){     //Contrasena modificada
          this.mensajeModal.fire({
            text: 'Contraseña modificada correctamente',
            icon: 'success',
            showCloseButton: true,
            showConfirmButton:false
          });
          this.contrasenyaForm.controls.contrasenyaActual.setValue("");
          this.contrasenyaForm.controls.contrasenya.setValue("");
          this.contrasenyaForm.controls.repetirContrasenya.setValue("");
          this.contrasenyaForm.markAsUntouched();
        }
        console.log(res);
        this.cargandoCont=false;
      }, (err:any) => {
        this.cargandoCont=false;
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
          case 401003:                                 //Usuario o contraseña incorrectas
              this.errorContIncorrecta=true;
              this.errorContIgualEmail=false;
              this.errorContIgual=false;
              break;
          case 400001:                                 //Usuario y email no pueden ser iguales
              this.errorContIncorrecta=true;
              this.errorContIgualEmail=false;
              this.errorContIgual=false;
              break;
          case 400008:                                 //Contrasenya distinta a la antigua
              this.errorContIgual=true;
              this.errorContIncorrecta=false;
              this.errorContIgualEmail=false;
              break;
          case 401002:                                 //No existes
              txt=err.error.msg;
              this.usuarioService.logout();
              break;
          case 400005:                                 //Error actualizando
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

  logout(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.cargandoLogout=true;
    this.usuarioService.actualizarUsuario({tokenDispositivo: ""})
      .subscribe( (res:any) => {
        if(res.codigo==201001){     //Usuario modificado
          this.usuarioService.logout();
          this.grupoService.setNombreGrupoActual("");
          this.grupoService.setIdGrupoActual("");
          this.cargandoLogout=false;
          this.navController.navigateRoot('/inicio');
        }
        console.log(res);
      }, (err:any) => {
        this.cargandoLogout=false;
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
          case 401002:                                 //Usuario no existe
              txt=err.error.msg;
              break;
          case 400005:                                 //Error actualizando
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

  mostrarModalConexion(){
    this.mensajeModal.fire({
      title: 'Conexión',
      text: 'No dispones de conexion a internet en estos momentos. Inténtalo de nuevo más tarde.',
      icon: 'warning',
      confirmButtonText: 'Aceptar'
    });
  }
}
