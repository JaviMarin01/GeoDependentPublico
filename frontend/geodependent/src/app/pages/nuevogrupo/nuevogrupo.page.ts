import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { GrupoService } from '../../services/grupo.service';
import { NavController } from '@ionic/angular';
import { UsuarioService } from '../../services/usuario.service';
import { ConexionService } from '../../services/conexion.service';

@Component({
  selector: 'app-nuevogrupo',
  templateUrl: './nuevogrupo.page.html',
  styleUrls: ['./nuevogrupo.page.scss'],
})
export class NuevogrupoPage implements OnInit {

  public mensajeModal = Swal.mixin({
    customClass: {
      confirmButton: 'botonAceptar',
      title: 'tituloModal',
      htmlContainer: 'textoModal'
    },
    buttonsStyling: false,
    heightAuto: false
  })

  public grupoForm = this.fb.group({
    nombre: ['', Validators.required]
  },
  {
    updateOn:'submit'
  });

  public cargando=false;
  public subNuevo:any;

  constructor(private fb:FormBuilder, private grupoService: GrupoService, private navController: NavController,
    private usuarioService: UsuarioService, private conexionService: ConexionService){

    }

  ngOnInit() {

  }

  ionViewWillEnter() {
    this.grupoForm.controls.nombre.setValue("");
    this.grupoForm.markAsUntouched();
  }

  ngOnDestroy(){
    if(this.subNuevo)
      this.subNuevo.unsubscribe();
  }


  crearGrupo(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.grupoForm.markAllAsTouched();
    console.log(this.grupoForm.value);
    if (this.grupoForm.valid && !this.cargando) {
      this.cargando=true;
      this.subNuevo=this.grupoService.crearGrupo(this.grupoForm.value)
        .subscribe((res:any) => {
          if(res.codigo==201003){         //Grupo creado
            this.mensajeModal.fire({
              text: 'Grupo creado correctamente',
              icon: 'success',
              showCloseButton: true,
              showConfirmButton:false
            });
            this.navController.navigateRoot("/cuidador-inicio");
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
            this.navController.navigateRoot("/cuidador-inicio");
            return;
          }
          let txt="";
          switch (err.error.codigo) {
            case 401015:                                //Solo puedes tener un grupo como máximo si no estás suscrito
              txt=err.error.msg;
              this.navController.navigateRoot("/cuidador-inicio");
              break;
            case 401002:                                //Usuario no existe
              txt=err.error.msg;
              this.usuarioService.logout();
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
        });

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
