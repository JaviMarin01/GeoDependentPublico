import { Component, NgZone, OnInit, AfterViewInit } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import { FormBuilder, Validators } from '@angular/forms';
import { GrupoService } from '../../services/grupo.service';
import { Grupo } from '../../models/grupo.model';
import Swal from 'sweetalert2';
import { ModalController, Platform, NavController } from '@ionic/angular';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationResponse } from '@ionic-native/background-geolocation/ngx';
import { ConexionService } from '../../services/conexion.service';
import { BackgroundMode } from '@ionic-native/background-mode/ngx';

@Component({
  selector: 'app-dependiente-inicio',
  templateUrl: './dependiente-inicio.page.html',
  styleUrls: ['./dependiente-inicio.page.scss'],
})
export class DependienteInicioPage implements OnInit, AfterViewInit {

  public mensajeModal = Swal.mixin({
    customClass: {
      confirmButton: 'botonAceptar',
      title: 'tituloModal',
      htmlContainer: 'textoModal'
    },
    buttonsStyling: false,
    heightAuto: false
  })

  public foreground=true;
  public permiso=-1;
  public posicion={latitud:0, longitud:0};
  public interval:any;
  public localizacionActivada=false;
  public intervalUbicacion:any;

  public config: BackgroundGeolocationConfig = {
    desiredAccuracy: 10,
    stationaryRadius: 20,
    distanceFilter: 30,
    debug: true, //  enable this hear sounds for background-geolocation life-cycle.
    stopOnTerminate: true,
    locationProvider: 2, //Será el proveedor de localización. Gps, Wifi, Gms, etc...
    interval: 200, //El intervalo en el que se comprueba la localización.
    saveBatteryOnBackground : false
};

  public unirseGrupo = this.fb.group({
    codigo: ['', Validators.required ]
  },
  {
    updateOn: 'submit'
  });

  public cordova:any;

  public codigoIncorrecto=false;
  public yaUnido=false;

  public grupos: Grupo[] = [];

  public cargandoGrupos=false;
  public cargandoUnirse=false;
  public cargandoSalir=false;
  public cargandoLogout=false;
  public sel=-1;

  public subCargar:any;
  public subModificar:any;
  public subSalir:any;
  public subUnirse:any;
  public subConex: any;

  public subBack: any;
  public subFront:any;

  public intervaloDespierto:any;

  public conex: boolean = true;

  constructor(private usuarioService: UsuarioService, private fb:FormBuilder, private grupoService: GrupoService, private modalCtrl: ModalController,
    private platform: Platform, private diagnostic: Diagnostic, private navController: NavController,
     private zone:NgZone, private backgroundGeolocation: BackgroundGeolocation, private conexionService: ConexionService,
     private backgroundMode: BackgroundMode) { }

  ngOnInit() {
    this.obtenerGrupos();
    this.subConex=this.conexionService.hayConexion.subscribe((value: boolean) => {
      this.conex = value;
    });
  }

  ngAfterViewInit(): void {
    this.inicializarApp();
  }

  inicializarApp(){
    this.platform.ready().then(() => {
      //Configura el plugin
      this.backgroundGeolocation.configure(this.config)
        .then((location: BackgroundGeolocationResponse) => {
          console.log("conf: ",location);
        },error=>{
          console.log('error',error);
      });

      //Esto hace que se siga ejecutando aun en segundo plano (Pero a los 5 min deja de funcionar. No se muy bien porque???)
      this.backgroundMode.enable();
      this.backgroundMode.disableBatteryOptimizations();
      //this.backgroundMode.disableWebViewOptimizations();

      this.intervaloDespierto=setInterval(() => {
        console.log("despierto ", new Date().getHours(), ':', new Date().getMinutes(), ':', new Date().getSeconds());
        this.comprobarPermisos(true);
      }, 120000);

      //Compruba permisos (y obtiene posicion)
      this.comprobarPermisos(true);

      this.subBack=this.platform.pause.subscribe(() => {// background
        console.log('In Background');
        this.foreground=false;
      });

      this.subFront=this.platform.resume.subscribe(() => {// foreground
        console.log('In Foreground');
        this.foreground=true;
        this.comprobarPermisos(false);
        this.comprobarActivado();
      });
    });
  }

  ngOnDestroy(){
    if(this.subCargar)
      this.subCargar.unsubscribe();
    if(this.subModificar)
      this.subModificar.unsubscribe();
    if(this.subSalir)
      this.subSalir.unsubscribe();
    if(this.subUnirse)
      this.subUnirse.unsubscribe();
    if(this.subConex)
      this.subConex.unsubscribe();
    if(this.subBack)
      this.subBack.unsubscribe();
    if(this.subFront)
      this.subFront.unsubscribe();
    clearInterval(this.intervaloDespierto);
    this.backgroundMode.disable();
  }

  //Comprueba los permisos de localizacion
  async comprobarPermisos(intervalo: boolean){
    this.diagnostic.getLocationAuthorizationStatus().then((status:any) =>{
      switch(status){
        case this.diagnostic.permissionStatus.NOT_REQUESTED:
            //Si no se le ha pedido permiso aun y el usuario esta usando el dispositivo, se le pide
            if(this.foreground){
              this.pedirPermiso();
            }
            if(!intervalo){
              this.zone.run(() => {
              });
            }
            this.permiso=0;
            break;
        case this.diagnostic.permissionStatus.DENIED_ONCE:
            //Si lo ha denegado no puedo hacer nada
            this.permiso=1;
            if(!intervalo){
              this.zone.run(() => {
              });
            }
            break;
        case this.diagnostic.permissionStatus.DENIED_ALWAYS:
            //Si lo ha denegado para siempre no puedo hacer nada
            this.permiso=2;
            if(!intervalo){
              this.zone.run(() => {
              });
            }
            break;
        case this.diagnostic.permissionStatus.GRANTED:
           this.permiso=3;
           if(!intervalo){
            this.zone.run(() => {
            });
          }
          //Obtener ubicacion siempre, en foreground y background
          if(intervalo)
            this.obtenerPosicion();
          break;
        case this.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE:
           this.permiso=4;
           if(!intervalo){
            this.zone.run(() => {
            });
          }
          //Obtener ubicacion solo cuando esta en foreground
          if(this.foreground && intervalo){
            this.obtenerPosicion();
          }
          break;
      }
    },error=>{
        console.log('error',error);
    });

  }

  //Comprueba si tiene activada la localizacion en el movil o no, para pedirle que la active o no
  async comprobarActivado(){
    await this.diagnostic.isLocationEnabled().then((activado:any) =>{
      this.localizacionActivada=activado;
      this.zone.run(() => {});
    },error=>{
      console.log('error',error);
    });
  }

  //Pide permiso de ubicacion
  pedirPermiso(){
    if(this.mensajeModal.isVisible())
      this.mensajeModal.close();
    this.diagnostic.requestLocationAuthorization().then((status:any) =>{
      switch(status){
        case this.diagnostic.permissionStatus.NOT_REQUESTED:
            break;
        case this.diagnostic.permissionStatus.DENIED_ALWAYS:
            break;
        case this.diagnostic.permissionStatus.GRANTED:
            break;
        case this.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE:
            break;
      }
    },error=>{
        console.log('error',error);
    });
  }

  //Obtiene la posicion del dispositivo si tiene la ubicacion activada y la guarda en la base de datos
  async obtenerPosicion(){
    await this.comprobarActivado();
    if(this.localizacionActivada && this.conexionService.hayConexion.value){
      this.backgroundGeolocation.getCurrentLocation().then((position:any) =>{
        this.posicion.latitud=position.latitude;
        this.posicion.longitud=position.longitude;
        let usu={posicion: this.posicion.latitud+";"+this.posicion.longitud};
        console.log(usu);
        if(this.conex){
          this.subModificar=this.usuarioService.actualizarUsuario(usu)
          .subscribe((res:any)=>{
            if(res.codigo==201001){

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
              return;
            }
            let txt="";
            switch (err.error.codigo) {
              case 401002:                                //Usuario no existe
                this.usuarioService.logout();
                break;
              case 400005:                              //Error actualizando usuario
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
      },error=>{
          console.log('error',error);
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
          clearInterval(this.interval);
          clearInterval(this.intervaloDespierto);
          clearInterval(this.intervalUbicacion);
          this.grupoService.setNombreGrupoActual("");
          this.grupoService.setIdGrupoActual("");
          this.cargandoLogout=false;
          this.navController.navigateRoot('/inicio');
        }
        console.log(res);
      }, (err:any) => {
        this.cargandoLogout=false;
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

  //Unirse a un grupo
  unirse(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    if(!this.cargandoUnirse){
      this.unirseGrupo.markAllAsTouched();
      console.log(this.unirseGrupo.value);
      if(this.unirseGrupo.valid){
        this.cargandoUnirse=true;
        this.subUnirse=this.grupoService.unirseAGrupo(this.unirseGrupo.value)
        .subscribe((res:any)=>{
          if(res.codigo==201005){
            this.mensajeModal.fire({
              text: 'Te has unido al grupo',
              icon: 'success',
              showCloseButton: true,
              showConfirmButton:false
            });
            this.obtenerGrupos();
            this.modalCtrl.dismiss();
            this.yaUnido=false;
            this.codigoIncorrecto=false;
          }
          console.log(res);
          this.cargandoUnirse=false;
        }, (err:any) => {
          this.cargandoUnirse=false;
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
            case 401016:                                //Solo pueden haber 2 personas máximo en un grupo si el creador no está suscrito
              txt=err.error.msg;
              this.yaUnido=false;
              this.codigoIncorrecto=false;
              break;
            case 401006:                                //Usuario ya unido
              this.yaUnido=true;
              this.codigoIncorrecto=false;
              break;
            case 401007:                                //Codigo incorrecto==no existe el grupo
              this.codigoIncorrecto=true;
              this.yaUnido=false;
              break;
            case 400004:                              //Error actualizando grupo
            case 500:                                 //Error en el servidor
                txt="Ha ocurrido un error en el servidor. Inténtalo de nuevo más tarde.";
                this.yaUnido=false;
                this.codigoIncorrecto=false;
                break;
            default:
                txt="Ha ocurrido un error."
                this.yaUnido=false;
                this.codigoIncorrecto=false;
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


  //Salir de un grupo
  salirGrupo(id:string, i:number){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    if(!this.cargandoSalir){
      this.cargandoSalir=true;
      this.sel=i;
      let salir={uidGrupo: id};
      this.subSalir=this.grupoService.salirseGrupo(salir)
        .subscribe((res:any)=>{
          if(res.codigo==201006){
            this.mensajeModal.fire({
              text: 'Te has salido del grupo',
              icon: 'success',
              showCloseButton: true,
              showConfirmButton:false
            });
            this.grupos.splice(i,1);
          }
          console.log(res);
          this.cargandoSalir=false;
          this.sel=-1;
        }, (err:any) => {
          this.cargandoSalir=false;
          this.sel=-1;
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
            case 401012:                                //No te pertenece el grupo
            case 401007:                                //Grupo no existe
              txt=err.error.msg;
              this.grupos.splice(i,1);
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

  //Mostrar ajustes de la aplicacion si no tiene los permisos necesarios
  mostrarAjustesApp(){
    this.backgroundGeolocation.showAppSettings();
  }

  //Mostrar el ajuste de ubicacion para poder activarlo si esta desactivado
  activarUbicacion(){
    this.diagnostic.switchToLocationSettings();
  }

  cerrarModalUnirse(){
    this.unirseGrupo.controls.codigo.setValue("");
    this.unirseGrupo.markAsUntouched();
    this.yaUnido=false;
    this.codigoIncorrecto=false;
  }

  //Obtener los grupos en los que esta el dependiente
  obtenerGrupos(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.cargandoGrupos=true;
    this.grupos=[];
    this.subCargar=this.grupoService.obtenerGrupos({})
      .subscribe((res:any)=>{
        if(res.codigo==200002){
          this.grupos=res['grupos'];
        }
        console.log(res);
        this.cargandoGrupos=false;
      }, (err:any) => {
        this.cargandoGrupos=false;
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
      });

  }

  refrescar(event:any){
    if(!this.cargandoGrupos && !this.cargandoSalir){
      this.obtenerGrupos();
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
