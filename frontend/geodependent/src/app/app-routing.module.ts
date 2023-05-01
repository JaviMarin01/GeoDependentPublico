import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { NoauthGuard } from './guards/noauth.guard';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },
  {
    path: 'inicio',
    loadChildren: () => import('./pages/inicio/inicio.module').then( m => m.InicioPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'registro',
    loadChildren: () => import('./pages/registro/registro.module').then( m => m.RegistroPageModule)
  },
  {
    path: 'dependiente-inicio', data:{ rol: 'ROL_DEPENDIENTE'},
    loadChildren: () => import('./pages/dependiente-inicio/dependiente-inicio.module').then( m => m.DependienteInicioPageModule)
  },
  {
    path: 'cuidador-inicio', data:{ rol: 'ROL_CUIDADOR'},
    loadChildren: () => import('./pages/cuidador-inicio/cuidador-inicio.module').then( m => m.CuidadorInicioPageModule)
  },
  {
    path: 'zonas', data:{ rol: 'ROL_CUIDADOR'},
    loadChildren: () => import('./pages/zonas/zonas.module').then( m => m.ZonasPageModule)
  },
  {
    path: 'nuevazona', data:{ rol: 'ROL_CUIDADOR'},
    loadChildren: () => import('./pages/nuevazona/nuevazona.module').then( m => m.NuevazonaPageModule)
  },
  {
    path: 'zona/:uid', data:{ rol: 'ROL_CUIDADOR'},
    loadChildren: () => import('./pages/zona/zona.module').then( m => m.ZonaPageModule)
  },
  {
    path: 'horarios', data:{ rol: 'ROL_CUIDADOR'},
    loadChildren: () => import('./pages/horarios/horarios.module').then( m => m.HorariosPageModule)
  },
  {
    path: 'horario/:uid', data:{ rol: 'ROL_CUIDADOR'},
    loadChildren: () => import('./pages/horario/horario.module').then( m => m.HorarioPageModule)
  },
  {
    path: 'nuevohorario', data:{ rol: 'ROL_CUIDADOR'},
    loadChildren: () => import('./pages/nuevohorario/nuevohorario.module').then( m => m.NuevohorarioPageModule)
  },
  {
    path: 'nuevogrupo', data:{ rol: 'ROL_CUIDADOR'},
    loadChildren: () => import('./pages/nuevogrupo/nuevogrupo.module').then( m => m.NuevogrupoPageModule)
  },
  {
    path: 'grupo/:uid', data:{ rol: 'ROL_CUIDADOR'},
    loadChildren: () => import('./pages/grupo/grupo.module').then( m => m.GrupoPageModule)
  },
  {
    path: 'perfil', data:{ rol: 'ROL_CUIDADOR'},
    loadChildren: () => import('./pages/perfil/perfil.module').then( m => m.PerfilPageModule)
  },
  {
    path: 'premium', data:{ rol: 'ROL_CUIDADOR'},
    loadChildren: () => import('./pages/premium/premium.module').then( m => m.PremiumPageModule)
  },
  {
    path: 'notificaciones',
    loadChildren: () => import('./pages/notificaciones/notificaciones.module').then( m => m.NotificacionesPageModule)
  }




  /*{
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },*/
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
