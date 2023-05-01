import { Component, OnInit } from '@angular/core';
import { RangeCustomEvent, NavController } from '@ionic/angular';
import { Validators, FormBuilder } from '@angular/forms';
import Swal from 'sweetalert2';
import { ZonaService } from '../../services/zona.service';
import { Router, ActivatedRoute } from '@angular/router';

import * as L from "leaflet";
import { GrupoService } from '../../services/grupo.service';
import { ConexionService } from '../../services/conexion.service';
import { Grupo } from '../../models/grupo.model';

@Component({
  selector: 'app-zona',
  templateUrl: './zona.page.html',
  styleUrls: ['./zona.page.scss'],
})
export class ZonaPage implements OnInit {

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
  public valor =0;

  public uid="";

  public zonaForm = this.fb.group({
    nombre: ['', Validators.required],
    tipo: ['', Validators.required],
    radio: ['', Validators.min(1)],
    posicion: ['']
  });

  public layerZonas = L.layerGroup();
  public zona = L.circle([0,0]);

  map:any;

  public cargandoModificar=false;

  public datosCargados=false;

  public subCargar:any;
  public subModificar:any;

  public grupo: Grupo = new Grupo("","","", "", [], [], new Date());

  constructor(private fb:FormBuilder, private zonaService: ZonaService, private router: Router, private route:ActivatedRoute,
              private navController: NavController, private grupoService: GrupoService, private conexionService: ConexionService) {
  }

  ngOnInit() {
    this.uid = this.route.snapshot.params['uid'];
  }

  ionViewWillEnter() {
    if(this.grupoService.idGrupoActual!=""){   //Si ha seleccionado un grupo cargamos la info
      this.cargarDatos();
      this.grupo=this.grupoService.objetoGrupoActual;
    }else{
      this.grupo = new Grupo("","","", "", [], [], new Date());
      this.navController.navigateRoot('/zonas');
    }
  }

  ngOnDestroy(){
    if(this.subCargar)
      this.subCargar.unsubscribe();
    if(this.subModificar)
      this.subModificar.unsubscribe();
  }

  cargarMapa(){
    console.log(this.map);
    if(this.map){
      this.map.remove();
    }

    this.map = L.map("map1", { zoomControl: false }).setView([Number(this.zonaForm.controls.posicion.value?.split(";")[0]), Number(this.zonaForm.controls.posicion.value?.split(";")[1])], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY- SA</a>'})
        .addTo(this.map); // This line is added to add the Tile Layer to our map

    setTimeout(() => {
      this.map.invalidateSize();
    }, 500);

    this.layerZonas = L.layerGroup().addTo(this.map);
    let zona2 = L.circle(this.map.getCenter(), {
      color:'#48BD4D',
      radius: Number(this.zonaForm.controls.radio.value)
    }).addTo(this.layerZonas);

    if(this.zonaForm.controls.tipo.value=="ZONA_SEGURA"){
      zona2.setStyle({color: "#48BD4D"});
    }else if(this.zonaForm.controls.tipo.value=="ZONA_PROHIBIDA"){
      zona2.setStyle({color: "#BD4848"});
    }

    this.zona=zona2;

    //Centrar zona al deslizar
    this.map.on("drag", function(e:L.LeafletMouseEvent){
      zona2.setLatLng(e.target.getBounds().getCenter());
    });
  }

  onIonChange(ev: Event) {
    this.valor=Number((ev as RangeCustomEvent).detail.value);
    this.zona.setRadius(this.valor);
  }

  radioChange(ev: Event) {
    if((ev as CustomEvent).detail.value=="ZONA_SEGURA"){
      this.zona.setStyle({color: "#48BD4D"});
    }else if((ev as CustomEvent).detail.value=="ZONA_PROHIBIDA"){
      this.zona.setStyle({color: "#BD4848"});
    }
  }

  modificarZona(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.zonaForm.markAllAsTouched();
    if (this.zonaForm.valid && this.datosCargados && !this.cargandoModificar) {
      this.cargandoModificar=true;
      let finalForm = this.fb.group({
        nombre: [this.zonaForm.controls.nombre.value],
        tipo:[this.zonaForm.controls.tipo.value],
        radio:[this.zonaForm.controls.radio.value],
        posicion:[String(this.zona.getBounds().getCenter().lat)+";"+String(this.zona.getBounds().getCenter().lng)]
      });
      console.log(finalForm.value);
      this.subModificar=this.zonaService.actualizarZona(finalForm.value, this.uid)
        .subscribe((res:any) => {
          if(res.codigo==201008){         //Zona actualizada
            this.mensajeModal.fire({
              text: 'Zona modificada correctamente',
              icon: 'success',
              showCloseButton: true,
              showConfirmButton:false
            });
            this.navController.navigateRoot("/zonas");
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
            this.navController.navigateRoot("/zonas");
            return;
          }
          let txt="";
          switch (err.error.codigo) {
            case 401008:                                 //Zona no existe
            case 401012:                                 //No te pertenece el grupo
            case 401007:                                 //Grupo no existe
                txt=err.error.msg;
                setTimeout(()=>{
                  this.navController.navigateRoot("/cuidador-inicio");
                }, 250);
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
          console.log(err.error);
        });
    }
  }

  cargarDatos() {
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      this.navController.navigateRoot("/zonas");
      return;
    }
    if (this.uid !== '') {
      this.subCargar=this.zonaService.obtenerZonas({id:this.uid})
        .subscribe( (res:any) => {
          if(res.codigo==200004){
            this.datosCargados=true;
            this.cargando=false;
            //Si ha obtenido una zona es que existe y le pertenece, si no no
            if(res['zonas'].length>0){
              this.zonaForm.controls.nombre.setValue(res['zonas'][0].nombre);
              this.zonaForm.controls.tipo.setValue(res['zonas'][0].tipo);
              this.zonaForm.controls.radio.setValue(res['zonas'][0].radio);
              this.zonaForm.controls.posicion.setValue(res['zonas'][0].posicion);
              this.valor=res['zonas'][0].radio;
              this.cargarMapa();
            }else{
              this.navController.navigateRoot('/zonas');
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
            this.navController.navigateRoot("/zonas");
            return;
          }
          let txt="";
          switch (err.error.codigo) {
            case 400007:                                 //Error obteniendo
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

  volver(){
    this.navController.navigateRoot("/zonas");
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
