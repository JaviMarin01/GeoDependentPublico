import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { UsuarioService } from '../../services/usuario.service';
import { NavController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { ConexionService } from '../../services/conexion.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  public mensajeModal = Swal.mixin({
    customClass: {
      confirmButton: 'botonAceptar',
      title: 'tituloModal',
      htmlContainer: 'textoModal'
    },
    buttonsStyling: false,
    heightAuto: false
  })

  public loginForm = this.fb.group({
    email: ['', Validators.required ],
    contrasenya: ['', Validators.required ],
    tokenDispositivo: [''],
    hashLogin: [environment.hashLogin]
  },
  {
    updateOn: 'submit'
  });

  public errorLogin=false;

  public cargandoLogin=false;

  public subLogin:any;

  constructor(private fb: FormBuilder, private usuarioService: UsuarioService, private navController: NavController,
              private conexionService: ConexionService) { }

  ngOnInit() {
  }

  ngOnDestroy(){
    if(this.subLogin)
      this.subLogin.unsubscribe();
  }

  login(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    if(!this.cargandoLogin){
      this.loginForm.markAllAsTouched();
      if (this.loginForm.valid) {
        this.loginForm.controls.tokenDispositivo.setValue(this.usuarioService.tokenDisp);
        this.cargandoLogin=true;
        console.log(this.loginForm.value);
        this.subLogin=this.usuarioService.login( this.loginForm.value)
        .subscribe( (res:any) => {
          if(res.codigo==200000){     //Login correcto
            this.errorLogin=false;
            this.mensajeModal.fire({
              text: 'Has iniciado sesión de manera correcta',
              icon: 'success',
              showCloseButton: true,
              showConfirmButton:false
            });
            switch (this.usuarioService.rol) {
              case 'ROL_DEPENDIENTE':
                this.navController.navigateRoot("/dependiente-inicio");
                break;
              case 'ROL_CUIDADOR':
                this.navController.navigateRoot("/cuidador-inicio");
                break;

            }
          }
          console.log(res);
          this.cargandoLogin=false;
        }, (err:any) => {
          this.cargandoLogin=false;
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
            case 401003:                                //Usuario o contraseña incorrectos
              this.errorLogin=true;
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
