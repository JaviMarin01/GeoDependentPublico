import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { HorarioService } from '../../services/horario.service';
import { ActivatedRoute } from '@angular/router';
import { ZonaService } from '../../services/zona.service';
import { GrupoService } from '../../services/grupo.service';
import { Zona } from '../../models/zona.model';
import { Horario } from '../../models/horario.model';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../models/usuario.model';
import { Grupo } from '../../models/grupo.model';
import { NavController, ToastController } from '@ionic/angular';
import { CalendarMode, Step } from 'ionic2-calendar/calendar';
import { ConexionService } from '../../services/conexion.service';

@Component({
  selector: 'app-horario',
  templateUrl: './horario.page.html',
  styleUrls: ['./horario.page.scss'],
})
export class HorarioPage implements OnInit {

  public mensajeModal = Swal.mixin({
    customClass: {
      confirmButton: 'botonAceptar',
      title: 'tituloModal',
      htmlContainer: 'textoModal'
    },
    buttonsStyling: false,
    heightAuto: false
  })

  public usuarios: Usuario[] = [];
  public usuariosSelec: Usuario[] = [];

  public zonas: Zona[] = [];
  public horario: Horario=new Horario("",[],[],[],"");
  public grupo: Grupo = new Grupo("","","", "", [], [], new Date());

  public uid="";

  public horarioForm = this.fb.group({
    uidZona: ['', Validators.required],
    uidUsuarios: [this.usuariosSelec]
  },
  {
    updateOn: 'submit'
  });

  public cargando=true;
  public cargandoUsuarios=false;
  public cargandoZonas=false;
  public cargandoModal=false;
  public cargandoModificar=false;
  public datosCargados=false;

  public subCargar:any;
  public subModificar:any;
  public subUsuarios:any;
  public subZonas:any;

  public enviado=false;

  public modalAbierto=false;
  public diasSem:string[]=[];
  public horas:string[]=[];
  public toast:any;
  public click = true;
  public posicion1 = new Date();
  public posicion2 = new Date();
  public tiempoAnt = new Date().getTime();
  public enEvento = false;
  public startEnEvento = new Date();
  public eventSource:any = [];
  public eventSourceAux:any = [];
  public viewTitle:any;
  public isToday:boolean=false;
  calendar = {
    mode: 'week' as CalendarMode,
    step: 30 as Step,
    formatWeekViewDayHeader: 'EEEEE',
    currentDate: new Date(),
    lockSwipeToPrev: 'true',
    startingDayWeek : 1,
    locale: 'es-ES',
    formatHourColumn: 'HH:mm',
    startHour: 0,
    endHour: 24,
  };

  constructor(private fb:FormBuilder, private horarioService: HorarioService, private zonaService: ZonaService,
    private grupoService: GrupoService, private route:ActivatedRoute, private usuarioService: UsuarioService, private navController: NavController,
      private toastController:ToastController, private conexionService: ConexionService) {
   }

  ngOnInit() {
    this.eventSource=[];
  }

  ionViewWillEnter() {
    if(this.grupoService.idGrupoActual!=""){   //Si ha seleccionado un grupo cargamos la info
      this.uid = this.route.snapshot.params['uid'];
      this.cargarDatos();
      this.grupo=this.grupoService.objetoGrupoActual;
      this.usuarios=[];
    }else{
      this.grupo = new Grupo("","","", "", [], [], new Date());
      this.usuarios=[];
      this.navController.navigateRoot("/horarios");
    }
  }

  ngOnDestroy(){
    if(this.subCargar)
      this.subCargar.unsubscribe();
    if(this.subModificar)
      this.subModificar.unsubscribe();
    if(this.subUsuarios)
      this.subUsuarios.unsubscribe();
    if(this.subZonas)
      this.subZonas.unsubscribe();
  }

  onEventSelected(event:any) {
    this.enEvento=true;
    this.startEnEvento= event.startTime;
  }

  onTimeSelected(ev:any) {
      console.log('Selected time: ' + ev.selectedTime + ', hasEvents: ' +
          (ev.events !== undefined && ev.events.length !== 0) + ', disabled: ' + ev.disabled);
      let endTime;
      let startTime;

      if(this.click && this.toast){
        this.toast.message="Seleccionando INICIO de la hora";
      }else if(!this.click && this.toast){
        this.toast.message="Seleccionando FIN de la hora";
      }

      if (new Date().getTime() - this.tiempoAnt > 200 && this.cargandoModal) {
        //Si esta en evento y haces click en el ultimo evento se lo borra
        if(!this.click && this.enEvento){
          this.eventSourceAux = [];
          for(let i=0;i<this.eventSource.length;i++){
            this.eventSourceAux.push(this.eventSource[i]);
          }
          this.enEvento=false;
          this.eventSource=[];
          for(let i=0;i<this.eventSourceAux.length;i++){
            this.eventSource.push(this.eventSourceAux[i]);
          }

          if(this.eventSource[this.eventSource.length-1].startTime==this.startEnEvento){
            this.eventSource.splice(this.eventSource.length-1, 1);
            this.click=true;
          }
          this.tiempoAnt = new Date().getTime();
          return;
        }
        this.eventSourceAux = [];
        if(!this.click){
          for(let i=0;i<this.eventSource.length-1;i++){
            this.eventSourceAux.push(this.eventSource[i]);
          }
        }else{
          for(let i=0;i<this.eventSource.length;i++){
            this.eventSourceAux.push(this.eventSource[i]);
          }
        }
        //Si esta en evento, comprueba el ultimo evento y lo borra
        if(this.enEvento){
          this.enEvento=false;
          for(let i=0;i<this.eventSourceAux.length;i++){
            if(this.eventSourceAux[i].startTime == this.startEnEvento){
              if(this.eventSourceAux[i].tipo=='seguido'){
                if(i<this.eventSourceAux.length-1 && this.eventSourceAux[i+1].tipo=='vuelta'){
                  this.eventSourceAux.splice(i+1,1);
                }
                this.eventSourceAux.splice(i,1);
              }else{
                this.eventSourceAux.splice(i,1);
                if(i>0 && this.eventSourceAux[i-1].tipo=='seguido'){
                  this.eventSourceAux.splice(i-1,1);
                }
              }
            }
          }
          this.eventSource=[];
          for(let i=0;i<this.eventSourceAux.length;i++){
            this.eventSource.push(this.eventSourceAux[i]);
          }
          this.tiempoAnt = new Date().getTime();
          return;
        }
        //Si hace click (es el inicio del rango horario) se guarda los tiempos del evento
        //Si deja de hacer click (indica el final del rango horario) comprueba si solapan las fechas con otras
        if (this.click) {
          startTime = ev.selectedTime;
          this.posicion1 = new Date();
          this.posicion1.setDate(ev.selectedTime.getDate());
          this.posicion1.setTime(ev.selectedTime.getTime());
          this.posicion1.setHours(ev.selectedTime.getHours());
          endTime = new Date();
          endTime.setDate(startTime.getDate());
          endTime.setTime(startTime.getTime());
          endTime.setHours(startTime.getHours(), startTime.getMinutes());
          this.posicion2 = new Date();
          this.posicion2.setDate(endTime.getDate());
          this.posicion2.setTime(endTime.getTime());
          this.posicion2.setHours(endTime.getHours());
        } else {
          startTime = this.posicion1;
          endTime = new Date();
          endTime.setDate(ev.selectedTime.getDate());
          endTime.setTime(ev.selectedTime.getTime());
          endTime.setHours(ev.selectedTime.getHours(), ev.selectedTime.getMinutes());

          this.posicion2 = new Date();
          this.posicion2.setDate(endTime.getDate());
          this.posicion2.setTime(endTime.getTime());
          this.posicion2.setHours(endTime.getHours());

          for(let i=0;i<this.eventSource.length-1;i++){
            if(this.eventSource[i].startTime.getTime() < endTime.getTime() && startTime.getTime() < this.eventSource[i].endTime.getTime()){
              this.mensajeModal.fire({
                title: 'Error',
                text: 'No puedes solapar fechas.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
              this.tiempoAnt = new Date().getTime();
              return;
            }
          }
        }

        //Si el dia final es menor que el inicial significa que va desde el origen hacia la derecha dando la vuelta empezando por la izquierda
        if ((!this.click && endTime.getDate() - startTime.getDate() < 0) || (!this.click && endTime.getDate() - startTime.getDate() == 0 && endTime.getTime() - startTime.getTime() < 0)) {
          let fechaFin=new Date();
          fechaFin.setDate(ev.selectedTime.getDate());
          let dist1=7-fechaFin.getDay();
          fechaFin.setDate(fechaFin.getDate()+dist1+1);
          fechaFin.setHours(0, 0);

          let fechaIni=new Date();
          fechaIni.setDate(ev.selectedTime.getDate());
          let dist=Math.abs(1-fechaIni.getDay());
          fechaIni.setDate(fechaIni.getDate()-dist);
          fechaIni.setHours(0, 0);

          for(let i=0;i<this.eventSource.length-1;i++){
            if(this.eventSource[i].startTime.getTime() <= endTime.getTime() && fechaIni.getTime() <= this.eventSource[i].endTime.getTime()){
              this.mensajeModal.fire({
                title: 'Error',
                text: 'No puedes solapar fechas.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
              this.tiempoAnt = new Date().getTime();
              return;
            }
          }

          for(let i=0;i<this.eventSource.length-1;i++){
            if(this.eventSource[i].startTime.getTime() <= fechaFin.getTime() && startTime.getTime() <= this.eventSource[i].endTime.getTime()){
              this.mensajeModal.fire({
                title: 'Error',
                text: 'No puedes solapar fechas.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
              this.tiempoAnt = new Date().getTime();
              return;
            }
          }

          endTime.setHours(endTime.getHours(), endTime.getMinutes()+30);

          this.eventSource = [];
          for(let i=0;i<this.eventSourceAux.length;i++){
            this.eventSource.push(this.eventSourceAux[i]);
          }
          this.eventSource.push({
            title: '',
            startTime: startTime,
            endTime: fechaFin,
            allDay: false,
            tipo: 'seguido',
            opacidad: 100
          });

          this.eventSource.push({
            title: '',
            startTime: fechaIni,
            endTime: endTime,
            allDay: false,
            tipo: 'vuelta',
            opacidad: 100
          });


        }else{
          endTime.setHours(endTime.getHours(), endTime.getMinutes()+30);

          this.eventSource = [];
          for(let i=0;i<this.eventSourceAux.length;i++){
            this.eventSource.push(this.eventSourceAux[i]);
          }
          if(this.click){
            this.eventSource.push({
              title: '',
              startTime: startTime,
              endTime: endTime,
              allDay: false,
              tipo: 'seguido',
              opacidad: 50
            });
          }else{
            this.eventSource.push({
              title: '',
              startTime: startTime,
              endTime: endTime,
              allDay: false,
              tipo: 'seguido',
              opacidad: 100
            });
          }
        }
        this.tiempoAnt = new Date().getTime();
        this.click = !this.click;
      }
  }

  contarEventos(){
    let num=0;
    for(let i=0;i<this.eventSource.length;i++){
      if(this.eventSource.tipo!="vuelta"){
        num++;
      }
    }
    return num;
  }

  abrirModal(abierto: boolean) {
    this.tiempoAnt =new Date().getTime();
    if(!abierto && !this.click){
      this.mensajeModal.fire({
        title: 'Error',
        text: 'Has dejado una fecha a medias. Selecciona a qué hora acaba o elimínala directamente.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
    this.modalAbierto = abierto;

    if(this.modalAbierto){
      this.cargandoModal=true;
      this.cargarHorariosEnCalendario();
      this.mostrarTipToast();
    }else{
      this.cargandoModal=false;
      this.toast.dismiss();
      this.asignarHorario();
    }
  }

  async mostrarTipToast() {
    this.toast = await this.toastController.create({
      message: 'Seleccionando INICIO de la hora',
      duration: 10000000000,
      position: 'top',
      cssClass: 'toastcss'
    });

    await this.toast.present();
  }

  //Se encarga de ver los horarios ya creados para asignarlos al abrir el modal del calendario y ver los eventos ahi
  cargarHorariosEnCalendario(){
    this.eventSource=[];
    let diasSemana=["D", "L", "M", "X", "J", "V", "S"];

    for(let i=0;i<this.diasSem.length;i++){
      let idx;
      let idx1;
      if(this.diasSem[i].includes(";")){
        idx=diasSemana.indexOf(this.diasSem[i].split(";")[0]);
        idx1=diasSemana.indexOf(this.diasSem[i].split(";")[1]);
      }else{
        idx=diasSemana.indexOf(this.diasSem[i]);
        idx1=diasSemana.indexOf(this.diasSem[i]);
      }
      let startTime=new Date();
      let daytoset=idx;
      var currentDay = startTime.getDay();
      if(daytoset==0){
        var distance = 7-currentDay;
      }else{
        var distance = daytoset - currentDay;
      }

      startTime.setDate(startTime.getDate() + distance);
      startTime.setHours(Number(this.horas[i].split(";")[0].split(":")[0]),Number(this.horas[i].split(";")[0].split(":")[1]));
      let endTime=new Date();
      let daytoset1=idx1;
      var currentDay = endTime.getDay();
      if(daytoset1==0){
        var distance = 7-currentDay;
      }else{
        var distance = daytoset1 - currentDay;
      }
      endTime.setDate(endTime.getDate() + distance);
      endTime.setHours(Number(this.horas[i].split(";")[1].split(":")[0]),Number(this.horas[i].split(";")[1].split(":")[1]));
      if ((endTime.getDate() - startTime.getDate() < 0) || (endTime.getDate() - startTime.getDate() == 0 && endTime.getTime() - startTime.getTime() < 0)) {

        let fechaFin=new Date();
        fechaFin.setDate(startTime.getDate());
        let dist1=7-fechaFin.getDay();
        fechaFin.setDate(fechaFin.getDate()+dist1+1);
        fechaFin.setHours(0,0);

        let fechaIni=new Date();
        fechaIni.setDate(startTime.getDate());
        let dist=Math.abs(1-fechaIni.getDay());
        fechaIni.setDate(fechaIni.getDate()-dist);
        fechaIni.setHours(0, 0);

        endTime.setHours(endTime.getHours(), endTime.getMinutes()+30);

        this.eventSource.push({
          title: '',
          startTime: startTime,
          endTime: fechaFin,
          allDay: false,
          tipo: 'seguido',
          opacidad: 100
        });

        this.eventSource.push({
          title: '',
          startTime: fechaIni,
          endTime: endTime,
          allDay: false,
          tipo: 'vuelta',
          opacidad: 100
        });
      }else{
        endTime.setHours(endTime.getHours(), endTime.getMinutes()+30);
        this.eventSource.push({
          title: '',
          startTime: startTime,
          endTime: endTime,
          allDay: false,
          tipo: 'seguido',
          opacidad: 100
        });
      }
    }
  }

  //Al cerrar el calendario, se encarga de recoger la informacion de los eventos y pasarla al formato requerido para la BD
  asignarHorario(){
    this.diasSem=[];
    this.horas=[];
    let diasSemana=["D", "L", "M", "X", "J", "V", "S"];

    for(let i=0;i<this.eventSource.length;i++){
      let ini="";
      let fin="";
      if(this.eventSource[i].tipo!='vuelta'){
        if(i<this.eventSource.length-1 && this.eventSource[i+1].tipo=='vuelta'){
          let fechaFin=new Date();
          fechaFin.setDate(this.eventSource[i+1].endTime.getDate());
          fechaFin.setHours(this.eventSource[i+1].endTime.getHours(), this.eventSource[i+1].endTime.getMinutes()-30);

          let horaIni=String(this.eventSource[i].startTime.getHours());
          if(horaIni.length==1){
            horaIni="0"+horaIni;
          }
          let minutoIni=String(this.eventSource[i].startTime.getMinutes());
          if(minutoIni.length==1){
            minutoIni="0"+minutoIni;
          }
          let horaFin=String(fechaFin.getHours());
          if(horaFin.length==1){
            horaFin="0"+horaFin;
          }
          let minutoFin=String(fechaFin.getMinutes());
          if(minutoFin.length==1){
            minutoFin="0"+minutoFin;
          }
          ini=horaIni+":"+minutoIni;
          fin=horaFin+":"+minutoFin;
          this.diasSem.push(diasSemana[this.eventSource[i].startTime.getDay()]+";"+diasSemana[fechaFin.getDay()]);
          this.horas.push(ini+";"+fin);
        }else if(this.eventSource[i].startTime.getDay()!=this.eventSource[i].endTime.getDay()){
          this.eventSource[i].endTime.setHours(this.eventSource[i].endTime.getHours(), this.eventSource[i].endTime.getMinutes()-30);
          let horaIni=String(this.eventSource[i].startTime.getHours());
          if(horaIni.length==1){
            horaIni="0"+horaIni;
          }
          let minutoIni=String(this.eventSource[i].startTime.getMinutes());
          if(minutoIni.length==1){
            minutoIni="0"+minutoIni;
          }
          let horaFin=String(this.eventSource[i].endTime.getHours());
          if(horaFin.length==1){
            horaFin="0"+horaFin;
          }
          let minutoFin=String(this.eventSource[i].endTime.getMinutes());
          if(minutoFin.length==1){
            minutoFin="0"+minutoFin;
          }
          ini=horaIni+":"+minutoIni;
          fin=horaFin+":"+minutoFin;
          this.diasSem.push(diasSemana[this.eventSource[i].startTime.getDay()]+";"+diasSemana[this.eventSource[i].endTime.getDay()]);
          this.horas.push(ini+";"+fin);
        }else{
          this.eventSource[i].endTime.setHours(this.eventSource[i].endTime.getHours(), this.eventSource[i].endTime.getMinutes()-30);
          let horaIni=String(this.eventSource[i].startTime.getHours());
          if(horaIni.length==1){
            horaIni="0"+horaIni;
          }
          let minutoIni=String(this.eventSource[i].startTime.getMinutes());
          if(minutoIni.length==1){
            minutoIni="0"+minutoIni;
          }
          let horaFin=String(this.eventSource[i].endTime.getHours());
          if(horaFin.length==1){
            horaFin="0"+horaFin;
          }
          let minutoFin=String(this.eventSource[i].endTime.getMinutes());
          if(minutoFin.length==1){
            minutoFin="0"+minutoFin;
          }
          ini=horaIni+":"+minutoIni;
          fin=horaFin+":"+minutoFin;
          this.diasSem.push(diasSemana[this.eventSource[i].startTime.getDay()]);
          this.horas.push(ini+";"+fin);
        }
      }
    }
    this.ordenarDatos();
  }

  //Ordena los eventos por orden semanal de Lunes a Domingo
  ordenarDatos(){
    let diasSemAux=[];
    for(let i=0;i<this.diasSem.length;i++){
        diasSemAux.push(this.diasSem[i]);
    }
    let semana=["L","M","X","J","V","S","D"];
    let arrayOrd=[];
    for(let i=0;i<this.diasSem.length;i++){
      let item="";
      if(this.diasSem[i].includes(";")){
        item=this.diasSem[i].split(";")[0];
      }else{
        item=this.diasSem[i];
      }
      let index = semana.indexOf(item);
      arrayOrd.push(index);
    }
    let list = [];
    for (var j = 0; j < arrayOrd.length; j++)
        list.push({'dia': arrayOrd[j], 'hora':this.horas[j], 'id':j});

    list.sort((a, b) => {
        if (a.dia < b.dia) {
          return -1;
        } else if (a.dia > b.dia) {
          return 1;
        }else{

            if (a.hora < b.hora) {
          return -1;
          } else if (a.hora > b.hora) {
              return 1;
          } else {
              return 0;
          }
        }
    });
    for (var k = 0; k < list.length; k++) {
        this.diasSem[k] = diasSemAux[list[k].id];
        this.horas[k] = list[k].hora;
    }
  }

  borrarHoraProg(i:any){
    this.diasSem.splice(i,1);
    this.horas.splice(i,1);
  }

  cargarDatos() {
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      this.navController.navigateRoot('/horarios');
      return;
    }
    if (this.uid !== '') {
      this.subCargar=this.horarioService.obtenerHorarios({id:this.uid})
        .subscribe( (res:any) => {
          if(res.codigo==200006){
            if(res['horarios'].length>0){
              this.horario=res['horarios'][0];
              this.horarioForm.controls.uidZona.setValue(this.horario.uidZona);
              this.diasSem=this.horario.diasSemana;
              this.horas=this.horario.horas;
              this.cargarUsuarios();
              this.obtenerZonas();
            }else{
              this.navController.navigateRoot('/horarios');
            }
            this.cargando=false;
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
            case 400007:                              //Error obteniendo
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

  anyadirUsuario(event:any){
      for(let i=0;i<this.usuarios.length;i++){
        if(this.usuarios[i].email==event.target.value){
          this.usuariosSelec.push(this.usuarios[i]);
          this.usuarios.splice(i,1);
          this.horarioForm.controls.uidUsuarios.setValue([]);
        }
      }
  }

  borrarUsuario(email:any){
    for(let i=0;i<this.usuariosSelec.length;i++){
      if(this.usuariosSelec[i].email==email){
        this.usuarios.push(this.usuariosSelec[i]);
        this.usuariosSelec.splice(i,1);
        this.horarioForm.controls.uidUsuarios.setValue([]);
      }
    }
  }

  cargarUsuarios(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      this.navController.navigateRoot('/horarios');
      return;
    }
    this.cargandoUsuarios=true;
    this.usuariosSelec=[];
    this.usuarios=[];
    this.subUsuarios=this.usuarioService.obtenerUsuarios({uidGrupo:this.grupo.id})
    .subscribe( (res:any) => {
      if(res.codigo==200001){
        this.usuarios=res['usuarios'];
        for(let j=0;j<this.usuarios.length;j++){
          if(this.usuarios[j].rol=="ROL_CUIDADOR"){
            this.usuarios.splice(j,1);
          }
        }
        this.usuariosSelec=[];
          for(let i=0;i<this.horario.uidUsuarios.length;i++){
            for(let j=0;j<this.usuarios.length;j++){
              if(this.usuarios[j].email==this.horario.uidUsuarios[i]){
                this.usuariosSelec.push(this.usuarios[j]);
                this.usuarios.splice(j,1);
              }
            }
          }
        this.cargandoUsuarios=false;
      }
      console.log(res);
    }, (err:any) => {
      this.cargandoUsuarios=false;
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
      console.log(err);
    });
  }

  obtenerZonas() {
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      this.navController.navigateRoot('/horarios');
      return;
    }
    this.cargandoZonas=true;
    this.subZonas=this.zonaService.obtenerZonas({uidGrupo:this.grupoService.idGrupoActual})
      .subscribe( (res:any) => {
        if(res.codigo==200004){
          this.zonas=res['zonas'];
        }
        this.cargandoZonas=false;
        console.log(res);
      }, (err:any) => {
        this.cargandoZonas=false;
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
        console.log(err);
      });
  }

  modificarHorario(){
    if(!this.conexionService.hayConexion.value){
      this.mostrarModalConexion();
      return;
    }
    this.enviado=true;
    this.horarioForm.markAllAsTouched();
    if (this.horarioForm.valid && this.usuariosSelec.length>0 && !this.cargandoModificar) {
      this.cargandoModificar=true;
      let usus:string[]=[];
      for(let i=0;i<this.usuariosSelec.length;i++){
        usus.push(this.usuariosSelec[i].email);
      }
      let finalForm = this.fb.group({
        uidZona: [this.horarioForm.controls.uidZona.value],
        uidUsuarios:[usus],
        diasSemana:[this.diasSem],
        horas:[this.horas],
      });
      console.log(finalForm.value);
      this.subModificar=this.horarioService.actualizarHorario(finalForm.value, this.uid)
        .subscribe((res:any) => {
          if(res.codigo==201010){         //Horario modificado
            this.mensajeModal.fire({
              text: 'Horario modificado correctamente',
              icon: 'success',
              showCloseButton: true,
              showConfirmButton:false
            });
            this.navController.navigateRoot("/horarios");
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
            return;
          }
          let txt="";
          switch (err.error.codigo) {
            case 401013:                                 //Solo modificado 1 vez al dia
                txt=err.error.msg;
                this.navController.navigateRoot("/horarios");
                break;
            case 401009:                                 //El usuario no tiene el rol dependiente
            case 401002:                                 //El usuario no existe
            case 401012:                                 //El usuario no es del grupo
                txt=err.error.msg;
                this.cargarUsuarios();
                break;
            case 401014:                                  //No pertenece a tus grupos
            case 401012:                                 //No te pertenece
                txt=err.error.msg;
                this.navController.navigateRoot("/horarios");
                break;
            case 401010:                                 //Horario no existe
                txt=err.error.msg;
                this.navController.navigateRoot("/horarios");
                break;
            case 401008:                                 //Zona no existe
                txt=err.error.msg;
                let enc=false;
                for(let i=0;i<this.zonas.length && !enc;i++){
                  if(this.zonas[i].id==finalForm.controls.uidZona.value){
                    enc=true;
                    this.zonas.splice(i,1);
                  }
                }
                break;
            case 401007:                                 //Grupo no existe
                txt=err.error.msg;
                this.navController.navigateRoot("/cuidador-inicio");
                break;
            case 400005:                              //Error actualizando
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
    this.navController.navigateRoot("/horarios");
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
