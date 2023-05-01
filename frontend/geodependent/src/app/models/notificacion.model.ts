export class Notificacion {
  constructor(
    public id:string,
    public texto: string,
    public fecha: Date,
    public uidUsuario: string,
    public leido:boolean
  )
  {}
}
