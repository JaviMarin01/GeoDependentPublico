import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConexionService {
  public hayConexion: BehaviorSubject<boolean> = new BehaviorSubject(true);

  constructor(){ }

  public isOnline() {
    return this.hayConexion.asObservable();
  }
}
