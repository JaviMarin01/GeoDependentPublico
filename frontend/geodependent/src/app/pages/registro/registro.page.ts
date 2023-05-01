import { Component, OnInit } from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { UsuarioService } from 'src/app/services/usuario.service';
import { matchValidator } from '../../helpers/contrasena-validacion';
import Swal from 'sweetalert2';
import { NavController } from '@ionic/angular';
import { ConexionService } from '../../services/conexion.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
})
export class RegistroPage implements OnInit {

  public mensajeModal = Swal.mixin({
    customClass: {
      confirmButton: 'botonAceptar',
      title: 'tituloModal',
      htmlContainer: 'textoModal'
    },
    buttonsStyling: false,
    heightAuto: false
  })

  public existeEmail=false;

  public cargando=false;
  public subRegistro:any;


  public registroForm = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.pattern("^[a-zA-z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-z]{2,4}$")]],
    contrasenya: ['', [Validators.required, Validators.pattern("^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,32}$"),matchValidator('repetirContrasenya', true)] ],
    repetirContrasenya: ['', [Validators.required, matchValidator('contrasenya')]],
    rol: ['', Validators.required],
    politicas: [false, Validators.requiredTrue]
  },
  {
    updateOn: 'submit'
  });

  constructor(private fb: FormBuilder, private usuarioService: UsuarioService, private navController: NavController,
              private conexionService: ConexionService) { }

  ngOnInit() {}

  ngOnDestroy(){
    if(this.subRegistro)
      this.subRegistro.unsubscribe();
  }

  registro(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    if(!this.cargando){
      this.registroForm.markAllAsTouched();
      if (this.registroForm.valid) {
        this.cargando=true;
        this.subRegistro=this.usuarioService.crearUsuario(this.registroForm.value)
        .subscribe( (res:any) => {
          if(res.codigo==201002){         //Usuario creado
            this.existeEmail=false;
            this.mensajeModal.fire({
              title: 'Registrado',
              text: 'Has sido registrado correctamente.',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
            this.navController.navigateRoot('/login');
          }
          console.log(res);
          this.cargando=false;
        }, (err) => {
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
            case 400000:                                 //Email existe
                this.existeEmail=true;
                break;
            case 400004:                                 //Error creando
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
