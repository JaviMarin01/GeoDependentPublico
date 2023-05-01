import { Component, OnInit } from '@angular/core';
import { RangeCustomEvent, NavController } from '@ionic/angular';
import { FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ZonaService } from '../../services/zona.service';
import { GrupoService } from '../../services/grupo.service';

import * as L from "leaflet";
import { ConexionService } from '../../services/conexion.service';
import { Grupo } from '../../models/grupo.model';

@Component({
  selector: 'app-nuevazona',
  templateUrl: './nuevazona.page.html',
  styleUrls: ['./nuevazona.page.scss'],
})
export class NuevazonaPage implements OnInit {

  public mensajeModal = Swal.mixin({
    customClass: {
      confirmButton: 'botonAceptar',
      title: 'tituloModal',
      htmlContainer: 'textoModal'
    },
    buttonsStyling: false,
    heightAuto: false
  })

  public valor =100;

  public zonaForm = this.fb.group({
    nombre: ['', Validators.required],
    tipo: ['', Validators.required],
    radio: ['', Validators.min(1)]
  });

  public layerZonas = L.layerGroup();
  public zona = L.circle([0,0]);

  map:any;

  public cargando=false;
  public subNuevo:any;

  public grupo: Grupo = new Grupo("","","", "", [], [], new Date());

  constructor(private fb:FormBuilder, private zonaService: ZonaService, private grupoService: GrupoService,
              private navController: NavController, private conexionService: ConexionService) { }

  ngOnInit() {

  }

  ionViewWillEnter() {
    if(this.grupoService.idGrupoActual!=""){   //Si ha seleccionado un grupo cargamos la info
      this.cargarMapa();
      this.grupo=this.grupoService.objetoGrupoActual;
    }else{
      this.grupo = new Grupo("","","", "", [], [], new Date());
      this.navController.navigateRoot('/zonas');
    }
  }

  ngOnDestroy(){
    if(this.subNuevo)
      this.subNuevo.unsubscribe();
  }

  cargarMapa(){
    console.log(this.map);
    if(this.map){
      this.map.remove();
    }

    this.map = L.map("map2", { zoomControl: false }).setView([38.61372, -0.1269], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY- SA</a>'})
        .addTo(this.map); // This line is added to add the Tile Layer to our map

    setTimeout(() => {
      this.map.invalidateSize();
    }, 500);

    this.layerZonas = L.layerGroup().addTo(this.map);
    let zona2 = L.circle(this.map.getCenter(), {
      color:'#48BD4D',
      radius: 100
    }).addTo(this.layerZonas);
    this.zona=zona2;

    //Se le anyade un drag para que este centrada todo el rato la zona
    this.map.on("drag", function(e:L.LeafletMouseEvent){
      zona2.setLatLng(e.target.getBounds().getCenter());
    });
  }

  //Radio de la zona
  onIonChange(ev: Event) {
    this.valor=Number((ev as RangeCustomEvent).detail.value);
    this.zona.setRadius(this.valor);
  }

  //Tipo de la zona
  radioChange(ev: Event) {
    if((ev as CustomEvent).detail.value=="ZONA_SEGURA"){
      this.zona.setStyle({color: "#48BD4D"});
    }else if((ev as CustomEvent).detail.value=="ZONA_PROHIBIDA"){
      this.zona.setStyle({color: "#BD4848"});
    }
  }

  crearZona(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.zonaForm.markAllAsTouched();
    if (this.zonaForm.valid && !this.cargando) {
      this.cargando=true;
      let finalForm = this.fb.group({
        nombre: [this.zonaForm.controls.nombre.value],
        tipo:[this.zonaForm.controls.tipo.value],
        radio:[this.valor],
        posicion:[String(this.zona.getBounds().getCenter().lat)+";"+String(this.zona.getBounds().getCenter().lng)],
        uidGrupo:[this.grupoService.idGrupoActual]
      });
      console.log(finalForm.value);
      this.subNuevo=this.zonaService.crearZona(finalForm.value)
        .subscribe((res:any) => {
          if(res.codigo==201007){         //Zona creada
            this.mensajeModal.fire({
              text: 'Zona creada correctamente',
              icon: 'success',
              showCloseButton: true,
              showConfirmButton:false
            });
            this.navController.navigateRoot("/zonas");
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
            this.navController.navigateRoot("/zonas");
            return;
          }
          let txt="";
          switch (err.error.codigo) {
            case 401017:                                //Solo pueden haber 1 zona como máximo en un grupo si el creador no está suscrito
              txt=err.error.msg;
              this.navController.navigateRoot("/zonas");
              break;
            case 401002:                                //El usuario no existe
            case 401012:                                //No te pertenece el grupo
            case 401007:                                //Grupo no existe
              txt=err.error.msg;
              this.navController.navigateRoot("/cuidador-inicio");
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
