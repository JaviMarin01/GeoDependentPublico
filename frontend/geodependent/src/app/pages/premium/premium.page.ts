import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import Swal from 'sweetalert2';
import { NavController } from '@ionic/angular';
import { ConexionService } from '../../services/conexion.service';
import { FormBuilder, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment.prod';
import { Stripe } from '@ionic-native/stripe/ngx';

@Component({
  selector: 'app-premium',
  templateUrl: './premium.page.html',
  styleUrls: ['./premium.page.scss'],
})
export class PremiumPage implements OnInit {

  public mensajeModal = Swal.mixin({
    customClass: {
      confirmButton: 'botonAceptar',
      cancelButton: 'botonCancelarModal',
      title: 'tituloModal',
      htmlContainer: 'textoModal'
    },
    buttonsStyling: false,
    heightAuto: false
  });

  public premiumForm = this.fb.group({
    numeroTarjeta: ['', Validators.required],
    cvc: ['', Validators.required],
    expiracionMes: ['', Validators.required],
    expiracionAno: ['', Validators.required]
  },
  {
    updateOn: 'submit'
  });

  public errorCvc=false;
  public errorExpiracion=false;
  public errorNumTarjeta=false;

  public anyos:number[]=[];

  public modalAbierto=false;

  public suscrito=false;
  public diasDiferencia=0;
  public fechaSuscripcion="";
  public fechaFinSuscripcion="";

  public cargandoUsu=false;
  public cargandoSuscrip=false;

  public tarjetaErronea=false;

  public subCargar:any;
  public subSuscrib:any;
  public subDesuscrib:any;

  constructor(private usuarioService: UsuarioService, private navController: NavController, private conexionService: ConexionService,
              private fb: FormBuilder, private stripe: Stripe) {
   }

  ngOnInit() {
    this.cargarDatos();
    this.sacarAnyos();
  }

  ngOnDestroy(){
    if(this.subCargar)
      this.subCargar.unsubscribe();
    if(this.subSuscrib)
      this.subSuscrib.unsubscribe();
    if(this.subDesuscrib)
      this.subDesuscrib.unsubscribe();
  }

  sacarAnyos(){
    this.anyos=[];
    let fechaActual=new Date();
    let anyoAct=fechaActual.getFullYear();
    for(let i=0;i<5;i++){
      this.anyos.push(anyoAct+i);
    }
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
          this.suscrito=this.usuarioService.suscripcion;
          this.calcularFecha();
        }
        console.log(res);
        this.cargandoUsu=false;
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

  calcularFecha(){
    let fechaFin = this.usuarioService.fechaSuscripcion;
    let dia = fechaFin.getDate().toString().padStart(2, '0');
    let mes = (fechaFin.getMonth() + 1).toString().padStart(2, '0');
    let anyo = fechaFin.getFullYear().toString();
    this.fechaSuscripcion=dia+"/"+mes+"/"+anyo;

    let fechaFinSus = this.usuarioService.fechaSuscripcion;
    fechaFinSus.setFullYear(fechaFinSus.getFullYear()+1);
    let diaFin = fechaFinSus.getDate().toString().padStart(2, '0');
    let mesFin = (fechaFinSus.getMonth() + 1).toString().padStart(2, '0');
    let anyoFin = fechaFinSus.getFullYear().toString();
    this.fechaFinSuscripcion=diaFin+"/"+mesFin+"/"+anyoFin;

    let fechaActual = new Date();
    let diferencia = fechaFinSus.getTime()-fechaActual.getTime();
    this.diasDiferencia = Math.floor(diferencia/86400000);
  }

  suscribirse(tokenTarj:string){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.cargandoSuscrip=true;
    let data={suscripcion: true, tokenTarjeta: tokenTarj};
    this.subSuscrib=this.usuarioService.suscribirse(data)
      .subscribe((res:any)=>{
        console.log(res);
        if(res.codigo==201012){
          this.mensajeModal.fire({
            text: 'Te has suscrito correctamente',
            icon: 'success',
            showCloseButton: true,
            showConfirmButton:false
          });
          this.abrirModal(false);
          this.suscrito=this.usuarioService.suscripcion;
          if(this.suscrito)
            this.calcularFecha();
        }
        this.cargandoSuscrip=false;
      }, (err:any) => {
        this.cargandoSuscrip=false;
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
          case 401026:                                 //El usuario ya está suscrito
              txt=err.error.msg;
              this.tarjetaErronea=false;
              this.navController.navigateRoot('/cuidador-inicio');
              break;
          case 401027:                                 //El usuario no está suscrito
              txt=err.error.msg;
              this.tarjetaErronea=false;
              this.navController.navigateRoot('/cuidador-inicio');
              break;
          case 401020:                                 //Tarjeta de crédito errónea
              this.tarjetaErronea=true;
              break;
          case 401021:                                 //Parametros invalidos
          case 401022:                                 //Ha ocurrido un problema con Stripe
              txt=err.error.msg;
              this.tarjetaErronea=false;
              break;
          case 401019:                                 //El pago no se ha realizado correctamente
              txt=err.error.msg;
              this.tarjetaErronea=false;
              break;
          case 400005:                                 //Error actualizando
          case 500:                                 //Error en el servidor
              txt="Ha ocurrido un error en el servidor. Inténtalo de nuevo más tarde.";
              this.tarjetaErronea=false;
              break;
          default:
              txt="Ha ocurrido un error."
              this.tarjetaErronea=false;
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

  preguntarSeguro(){
    if(!this.cargandoSuscrip){
      this.mensajeModal.fire({
        title: 'Estás seguro?',
        text: "Perderás todos tus grupos",
        icon: 'warning',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Aceptar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.cancelarSuscripcion();
        }
      })
    }
  }

  cancelarSuscripcion(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.cargandoSuscrip=true;
    let data={suscripcion: false};
    this.subDesuscrib=this.usuarioService.suscribirse(data)
      .subscribe((res:any)=>{
        if(res.codigo==201012){
          this.mensajeModal.fire({
            text: 'Te has desuscrito correctamente',
            icon: 'success',
            showCloseButton: true,
            showConfirmButton:false
          });
          this.suscrito=this.usuarioService.suscripcion;
          if(this.suscrito)
            this.calcularFecha();
        }
        console.log(res);
        this.cargandoSuscrip=false;
      }, (err:any) => {
        this.cargandoSuscrip=false;
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
          case 401026:                                 //El usuario ya está suscrito
              txt=err.error.msg;
              this.navController.navigateRoot('/cuidador-inicio');
              break;
          case 401027:                                 //El usuario no está suscrito
              txt=err.error.msg;
              this.navController.navigateRoot('/cuidador-inicio');
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

  async pagarConStripe() {
    if(!this.cargandoSuscrip){
      this.premiumForm.markAllAsTouched();
      if(this.premiumForm.valid){
        this.cargandoSuscrip=true;
        this.stripe.setPublishableKey(environment.stripe_key);

        let cardDetails = {
          number: String(this.premiumForm.controls.numeroTarjeta.value),
          expMonth: Number(this.premiumForm.controls.expiracionMes.value),
          expYear: Number(this.premiumForm.controls.expiracionAno.value),
          cvc: String(this.premiumForm.controls.cvc.value)
        }

        await this.stripe.validateCVC(cardDetails.cvc).then((tipo)=>{
          this.errorCvc=false;
        }).catch(error => {
          this.errorCvc=true;
        });

        await this.stripe.validateCardNumber(cardDetails.number).then((tipo)=>{
          this.errorNumTarjeta=false;
        }).catch(error => {
          this.errorNumTarjeta=true;
        });

        await this.stripe.validateExpiryDate(String(cardDetails.expMonth), String(cardDetails.expYear)).then((tipo)=>{
          this.errorExpiracion=false;
        }).catch(error => {
          this.errorExpiracion=true;
        });

        if(!this.errorNumTarjeta && !this.errorCvc && !this.errorExpiracion){
          let data={
            suscripcion:true,
            numeroTarjeta:this.premiumForm.controls.numeroTarjeta.value,
            expiracionMes:this.premiumForm.controls.expiracionMes.value,
            expiracionAno:this.premiumForm.controls.expiracionAno.value,
            cvc:this.premiumForm.controls.cvc.value,
          }
          this.stripe.createCardToken(cardDetails)
          .then(token => {
            this.suscribirse(token.id);
          })
          .catch(error => {
            console.log(error);
            this.mensajeModal.fire({
              title: 'Error',
              text: 'Ha ocurrido un error. Vuelve a intentarlo de nuevo.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          });
        }else{
          this.cargandoSuscrip=false;
        }
      }
    }
  }

  abrirModal(abierto: boolean) {
    this.modalAbierto = abierto;
    if(!this.cargandoSuscrip){
      this.errorCvc=false;
      this.errorExpiracion=false;
      this.errorNumTarjeta=false;
      this.cargandoSuscrip=false;
      this.premiumForm.markAsUntouched();
      this.premiumForm.controls.cvc.setValue("");
      this.premiumForm.controls.numeroTarjeta.setValue("");
      this.premiumForm.controls.expiracionMes.setValue("");
      this.premiumForm.controls.expiracionAno.setValue("");
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
