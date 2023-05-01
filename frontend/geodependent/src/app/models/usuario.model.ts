export class Usuario {
  constructor(
    public email: string,
    public rol: string,
    public token:string,
    public nombre?:string,
    public suscripcion?: boolean,
    public posicion?: string,
    public fechaSuscripcion?: Date,
    public uidGrupos?: string[],
    public ultimaActPosicion?: Date
  )
  {}
}
