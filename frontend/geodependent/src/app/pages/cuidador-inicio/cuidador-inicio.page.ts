import { Component, OnDestroy, OnInit } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import { GrupoService } from '../../services/grupo.service';
import { Grupo } from '../../models/grupo.model';
import Swal from 'sweetalert2';
import { Validators, FormBuilder } from '@angular/forms';
import { NavController, ModalController, Platform } from '@ionic/angular';

import * as L from "leaflet";
import { ZonaService } from '../../services/zona.service';
import { Zona } from '../../models/zona.model';
import { Usuario } from '../../models/usuario.model';
import { Storage } from '@ionic/storage';
import { ConexionService } from '../../services/conexion.service';

@Component({
  selector: 'app-cuidador-inicio',
  templateUrl: './cuidador-inicio.page.html',
  styleUrls: ['./cuidador-inicio.page.scss'],
})
export class CuidadorInicioPage implements OnInit, OnDestroy {

  public mensajeModal = Swal.mixin({
    customClass: {
      confirmButton: 'botonAceptar',
      title: 'tituloModal',
      htmlContainer: 'textoModal'
    },
    buttonsStyling: false,
    heightAuto: false
  })

  public unirseGrupo = this.fb.group({
    codigo: ['', Validators.required ]
  },
  {
    updateOn: 'submit'
  });

  public abierto=false;

  public codigoIncorrecto=false;
  public yaUnido=false;

  public cargando=true;

  public codigoModalAbierto = false;
  public codigoActual = -1;

  public idUsuario="";

  public seleccionado=-1;
  public selecAntes=-1;

  public prog:any;

  public grupos: Grupo[] = [];
  public gruposObtenidos=false;
  public posicNotifs: boolean[]=[];

  public zonas: Zona[] = [];
  public zonasObtenidas=false;

  public usuarios: Usuario[] = [];
  public usuariosObtenidos=false;

  public layerUsuarios = L.layerGroup();
  public layerZonas = L.layerGroup();

  mapa:any;

  public cargandoMapa=false;
  public cargandoUnirse=false;
  public cargandoBorrar=false;
  public cargandoSalir=false;
  public cargandoRecibirNotif=false;
  public sel="";

  public subCargar:any;
  public subZonas:any;
  public subUsuarios:any;
  public subBorrar:any;
  public subSalir:any;
  public subUnirse:any;
  public subRecibir:any;

  public foreground=true;

  constructor(private usuarioService: UsuarioService, private grupoService: GrupoService, private fb:FormBuilder, public navCtrl: NavController,
              private modalCtrl: ModalController, private zonaService: ZonaService, private storage: Storage,
              private platform: Platform, private conexionService: ConexionService) {
   }

   ngOnInit() {
    this.idUsuario=this.usuarioService.email;

    this.obtenerGrupos();
    this.obtenerZonas();
    this.obtenerUsuarios();

    this.prog=setInterval(() => {
      //Si no hay nada cargando en ese momento, entonces actualizamos info, sino no
      if(this.foreground && !this.gruposObtenidos && !this.zonasObtenidas && !this.usuariosObtenidos && !this.cargandoBorrar && !this.cargandoSalir && !this.cargandoUnirse && !this.cargandoRecibirNotif && this.conexionService.hayConexion.value){
        this.obtenerGrupos();
        this.obtenerZonas();
        this.obtenerUsuarios();
      }
    }, 5*60*1000);
  }

  ngAfterViewInit(): void {
    this.inicializarApp();
  }

  //Me sirve para controlar el 1 plano o 2 plano, y asi no hacer peticion de obtener grupos si esta en 2 plano
  inicializarApp(){
    this.platform.ready().then(() => {
      this.platform.pause.subscribe(() => {// background
        console.log('In Background');
        this.foreground=false;
      });

      this.platform.resume.subscribe(() => {// foreground
        console.log('In Foreground');
        this.foreground=true;
        this.obtenerGrupos();
        this.obtenerUsuarios();
        this.obtenerZonas();
      });
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.prog);
    if(this.subCargar)
      this.subCargar.unsubscribe();
    if(this.subBorrar)
      this.subBorrar.unsubscribe();
    if(this.subSalir)
      this.subSalir.unsubscribe();
    if(this.subUnirse)
      this.subUnirse.unsubscribe();
    if(this.subZonas)
      this.subZonas.unsubscribe();
    if(this.subUsuarios)
      this.subUsuarios.unsubscribe();
    if(this.subRecibir)
      this.subRecibir.unsubscribe();
  }

  //Crea el mapa de Leaflet
  cargarMapa(){
    this.cargandoMapa=true;
    if(this.mapa){
      this.mapa.remove();
    }
    this.mapa=null;
    //Crea el mapa
    this.mapa = L.map("map", { zoomControl: false }).setView([38.61372, -0.1269], 14);
    //Anyade tile del mapa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY- SA</a>'})
        .addTo(this.mapa);

    setTimeout(() => {
      this.mapa.invalidateSize();
    }, 500);

    //Layers para usuarios y zonas
    this.layerZonas = L.layerGroup().addTo(this.mapa);
    this.layerUsuarios = L.layerGroup().addTo(this.mapa);
    this.cargarPosiciones();

    this.mapa.dragging.disable();
    this.mapa.touchZoom.disable();
    this.mapa.doubleClickZoom.disable();
    this.mapa.scrollWheelZoom.disable();

    setTimeout(() => {
      this.mapa.dragging.enable();
      this.mapa.touchZoom.enable();
      this.mapa.doubleClickZoom.enable();
      this.mapa.scrollWheelZoom.enable();
    }, 500);
  }

  //Carga las posiciones de zonas y usuarios en el mapa
  cargarPosiciones(){
    this.layerZonas.clearLayers();
    this.layerUsuarios.clearLayers();

    let posicionZonas = this.zonas.filter(zona => (zona.uidGrupo==this.grupoService.idGrupoActual));

    for(let i=0;i<posicionZonas.length;i++){
      if(posicionZonas[i].tipo=="ZONA_SEGURA"){
        let zona = L.circle([Number(posicionZonas[i].posicion.split(";")[0]), Number(posicionZonas[i].posicion.split(";")[1])], {
          color:'#48BD4D',
          radius: Number(posicionZonas[i].radio)
        }).addTo(this.layerZonas);
      }else if(posicionZonas[i].tipo=="ZONA_PROHIBIDA"){
        let zona = L.circle([Number(posicionZonas[i].posicion.split(";")[0]), Number(posicionZonas[i].posicion.split(";")[1])], {
          color:'#BD4848',
          radius: Number(posicionZonas[i].radio)
        }).addTo(this.layerZonas);
      }
    }

    let grup=this.grupos.find(x=>x.id==this.grupoService.idGrupoActual);
    let posicionUsuarios:any;
    if(grup){
      posicionUsuarios = this.usuarios.filter(usuario => (usuario.rol=="ROL_DEPENDIENTE" && grup?.uidUsuarios.includes(usuario.email)));
    }

    for(let i=0;i<posicionUsuarios.length;i++){
      let fechaBD:any=posicionUsuarios[i].ultimaActPosicion;
      let fechaPos=new Date(fechaBD._seconds * 1000 + fechaBD._nanoseconds / 1000000)
      let mas2secs=false;

      if(fechaPos){
        let fechaAnt=new Date(fechaPos);
        let actual=new Date();
        let secs=Math.round((actual.getTime()-fechaAnt.getTime())/1000);
        if(secs>2*60){
          mas2secs=true;
        }
      }

      let icon:any;
      let icon1:any;

      if(mas2secs){
        //Icono rojo con alerta
        icon = L.divIcon({
          className: 'custom-div-icon',
          html: "<div class='marker-pinCuidado'><ion-icon name='alert-circle-outline'></ion-icon></div>",
          iconSize: [30, 42],
          iconAnchor: [15, 42]
        });
        //Icono rojo con alerta y nombre del usuario
        icon1 = L.divIcon({
          className: 'custom-div-icon',
          html: "<div class='marker-pin1Cuidado'><ion-icon name='alert-circle-outline'></ion-icon><p>"+posicionUsuarios[i].nombre+"</p></div>",
          iconSize: [30, 42],
          iconAnchor: [15, 42]
        });
      }else{
        //Icono del usuario
        icon = L.divIcon({
          className: 'custom-div-icon',
          html: "<div class='marker-pin'><ion-icon name='person'></ion-icon></div>",
          iconSize: [30, 42],
          iconAnchor: [15, 42]
        });
        //Icono del usuario con el nombre
        icon1 = L.divIcon({
          className: 'custom-div-icon',
          html: "<div class='marker-pin1'><ion-icon name='person'></ion-icon><p>"+posicionUsuarios[i].nombre+"</p></div>",
          iconSize: [30, 42],
          iconAnchor: [15, 42]
        });
      }

      let options = {icon: icon, abierto: false};
      var marker = L.marker([Number(posicionUsuarios[i].posicion?.split(";")[0]), Number(posicionUsuarios[i].posicion?.split(";")[1])], options).addTo(this.layerUsuarios);

      marker.on("click",function(e:any){
        if(!e.target.options.abierto){
          e.target.setIcon(icon1);
        }else{
          e.target.setIcon(icon);
        }
        e.target.options.abierto=!e.target.options.abierto;
      });

    }

    if(posicionUsuarios.length>0 && this.selecAntes!=this.seleccionado){  //Si he cambiado de grupo, redirige la camara a un usuario
      let pos=new L.LatLng(Number(posicionUsuarios[0].posicion?.split(";")[0]), Number(posicionUsuarios[0].posicion?.split(";")[1]))
      this.mapa.setView(pos,14);
    }

    this.cargandoMapa=false;
  }

  //Funcion que obtiene todos los grupos del usuario
  obtenerGrupos(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.subCargar=this.grupoService.obtenerGrupos({})
      .subscribe((res:any)=>{
        if(res.codigo==200002){
          this.gruposObtenidos=true;
          this.grupos=res['grupos'];
          this.posicNotifs=[];
          for(let i=0;i<this.grupos.length;i++){
            let pos=this.grupos[i].uidUsuarios?.indexOf(this.idUsuario);
            if(pos!=-1){
              this.posicNotifs.push(this.grupos[i].notificaciones[pos]);
            }
          }
          if(this.gruposObtenidos && this.zonasObtenidas && this.usuariosObtenidos){
            this.cargando=false;
            if(this.grupoService.idGrupoActual!=""){
              let selec=-1;
              for(let i=0;i<this.grupos.length;i++){
                if(this.grupos[i].id==this.grupoService.idGrupoActual){
                  selec=i;
                }
              }
              this.seleccionarGrupo(selec, false);
            }
            this.gruposObtenidos=false;
            this.zonasObtenidas=false;
            this.usuariosObtenidos=false;
          }
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

  //Function que obtiene todas las zonas del usuario
  obtenerZonas(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.subZonas=this.zonaService.obtenerZonas({})
      .subscribe((res:any)=>{
        if(res.codigo==200004){
          this.zonasObtenidas=true;
          this.zonas=res['zonas'];
          if(this.gruposObtenidos && this.zonasObtenidas && this.usuariosObtenidos){
            this.cargando=false;
            if(this.grupoService.idGrupoActual!=""){
              let selec=-1;
              for(let i=0;i<this.grupos.length;i++){
                if(this.grupos[i].id==this.grupoService.idGrupoActual){
                  selec=i;
                }
              }
              this.seleccionarGrupo(selec, false);
            }
            this.gruposObtenidos=false;
            this.zonasObtenidas=false;
            this.usuariosObtenidos=false;
          }
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

  //Funcion que obtiene todos los usuarios de los grupos del usuario actual
  obtenerUsuarios(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.subUsuarios=this.usuarioService.obtenerUsuarios({})
      .subscribe((res:any)=>{
        if(res.codigo==200001){
          this.usuariosObtenidos=true;
          this.usuarios=res['usuarios'];
          if(this.gruposObtenidos && this.zonasObtenidas && this.usuariosObtenidos){
            this.cargando=false;
            if(this.grupoService.idGrupoActual!=""){
              let selec=-1;
              for(let i=0;i<this.grupos.length;i++){
                if(this.grupos[i].id==this.grupoService.idGrupoActual){
                  selec=i;
                }
              }
              this.seleccionarGrupo(selec, false);
            }
            this.gruposObtenidos=false;
            this.zonasObtenidas=false;
            this.usuariosObtenidos=false;
          }
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

  //Seleccionar un grupo en el desplegable
  seleccionarGrupo(i:number, click:boolean){
    if(click && i==this.seleccionado){
      return;
    }

    this.selecAntes=this.seleccionado;
    this.seleccionado=i;

    if(i==-1){    //Si selecciona -1 significa que deja de seleccionarse, entonces oculta mapa
      this.storage.set("idGrupoActual","");
      this.storage.set("grupoActual","");
      this.grupoService.idGrupoActual="";
      let gr=new Grupo("","","", "", [], [], new Date());
      this.grupoService.objetoGrupoActual=gr;
      if(this.mapa){
        this.mapa._container.style.visibility="hidden";
      }
    }else{
      this.storage.set("idGrupoActual",this.grupos[i].id );
      this.storage.set("grupoActual",this.grupos[i].nombre );
      this.grupoService.idGrupoActual=this.grupos[i].id;
      this.grupoService.objetoGrupoActual=this.grupos[i];
      if(!this.mapa){
        this.cargarMapa();
      }else{
        this.cargarPosiciones();
        this.mapa._container.style.visibility="visible";
      }
    }
  }

  //Funcion para unirse a un nuevo grupo
  unirse(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.unirseGrupo.markAllAsTouched();
    if(this.unirseGrupo.valid && !this.cargandoUnirse && !this.cargandoSalir && !this.cargandoBorrar && !this.cargandoRecibirNotif){
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
          this.grupos.push(res['grupo1']);
          this.modalCtrl.dismiss();
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
          case 401002:                                //El usuario no existe
          case 401015:                                //Solo puedes tener un grupo como maximo si no suscrito
          case 401016:                                //Solo puede haber 2 pers max si creador no suscrito
              txt=err.error.msg;
              this.codigoIncorrecto=false;
              this.yaUnido=false;
              break;
          case 401006:                                //El usuario ya se ha unido
              txt="Ya estás unido al grupo";
              this.codigoIncorrecto=false;
              this.yaUnido=true;
              break;
          case 401007:                                //El codigo es incorrecto==no existe el grupo
            this.codigoIncorrecto=true;
            this.yaUnido=false;
            break;
          case 400005:                              //Error actualizando grupo
          case 500:                                 //Error en el servidor
              txt="Ha ocurrido un error en el servidor. Inténtalo de nuevo más tarde.";
              this.codigoIncorrecto=false;
              this.yaUnido=false;
              break;
          default:
              txt="Ha ocurrido un error."
              this.codigoIncorrecto=false;
              this.yaUnido=false;
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


  //Abrir el modal de unirse
  modalCodigo(abierto: boolean, i: number) {
    this.codigoActual = i;
    this.codigoModalAbierto = abierto;

    this.codigoIncorrecto=false;
    this.yaUnido=false;
  }

  //Cerrar el modal de unirse
  cerrarModalUnirse(){
    this.unirseGrupo.controls.codigo.setValue("");
    this.unirseGrupo.markAsUntouched();
    this.codigoIncorrecto=false;
    this.yaUnido=false;
  }

  //Funcion para borrar un grupo del usuario
  borrarGrupo(id:string) {
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    if(!this.cargandoUnirse && !this.cargandoSalir && !this.cargandoBorrar && !this.cargandoRecibirNotif){
      this.cargandoBorrar=true;
      this.sel=id;
      this.subBorrar=this.grupoService.borrarGrupo(id)
        .subscribe((res:any)=>{
          if(res.codigo==200003){
            this.mensajeModal.fire({
              text: 'Has borrado el grupo',
              icon: 'success',
              showCloseButton: true,
              showConfirmButton:false
            });
            this.sacarId(id);
          }
          console.log(res);
          this.cargandoBorrar=false;
          this.sel="";
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
            case 401011:                                //El grupo no es tuyo
            case 401007:                                //El grupo no existe
              txt=err.error.msg;
              this.sacarId(id);
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


  //Funcion para salirse de un grupo
  salirGrupo(id:string) {
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    if(!this.cargandoUnirse && !this.cargandoSalir && !this.cargandoBorrar && !this.cargandoRecibirNotif){
      this.cargandoSalir=true;
      this.sel=id;
      let data={
        uidGrupo: id
      }
      this.subSalir=this.grupoService.salirseGrupo(data)
        .subscribe((res:any)=>{
          if(res.codigo==201006){
            this.mensajeModal.fire({
              text: 'Te has salido del grupo',
              icon: 'success',
              showCloseButton: true,
              showConfirmButton:false
            });
            this.sacarId(id);
          }
          console.log(res);
          this.cargandoSalir=false;
          this.sel="";
        }, (err:any) => {
          this.cargandoSalir=false;
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
            case 401007:                                //El grupo no existe
            case 401012:                                //No te pertenece el grupo
              txt=err.error.msg;
              this.sacarId(id);
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

  recibirNotificacionGrupo(event:any, id:string, num:number){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    if(!this.cargandoUnirse && !this.cargandoBorrar && !this.cargandoSalir && !this.cargandoRecibirNotif && event.target.checked!=this.posicNotifs[num]){
      let notif=false;
      if(event.detail.checked){
        notif=true;
      }else{
        notif=false;
      }
      let data={
        notificacion: notif,
        uidGrupo: id
      }
      console.log(data);
      this.cargandoRecibirNotif=true;
      this.sel=id;
      this.subRecibir=this.grupoService.recibirNotificaciones(data)
        .subscribe((res:any)=>{
          if(res.codigo==201014){
            let numGr=-1;
            for(let j=0;j<this.grupos.length && numGr==-1;j++){
              if(this.grupos[j].id==id){
                numGr=j;
              }
            }
            if(numGr!=-1){
              this.posicNotifs[numGr]=notif;
            }
          }
          console.log(res);
          this.cargandoRecibirNotif=false;
          this.sel="";
        }, (err:any) => {
          this.cargandoRecibirNotif=false;
          this.sel="";

          let numGr=-1;
          for(let j=0;j<this.grupos.length && numGr==-1;j++){
            if(this.grupos[j].id==id){
              numGr=j;
            }
          }
          if(numGr!=-1){
            event.target.checked = notif;
          }

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
            case 401007:                                //El grupo no existe
            case 401012:                                //El grupo no te pertenece
              txt=err.error.msg;
              this.sacarId(id);
              break;
            case 400005:                              //Error actualizando usuarioEnGrupo
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

  sacarId(id:string){
    let numBorrar=-1;
    for(let j=0;j<this.grupos.length && numBorrar==-1;j++){
      if(this.grupos[j].id==id){
        numBorrar=j;
      }
    }
    if(numBorrar!=-1){
      this.grupos.splice(numBorrar,1);
      this.posicNotifs.splice(numBorrar,1);
      if(this.grupos.length>0){
        this.seleccionarGrupo(0, false);
      }else{
        this.seleccionarGrupo(-1, false);
      }
    }
  }

  abrirCerrar(){
    this.abierto=!this.abierto;
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
