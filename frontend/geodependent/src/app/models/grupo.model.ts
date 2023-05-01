export class Grupo {
  constructor(
    public id: string,
    public nombre: string,
    public codigo: string,
    public uidUsuarioCreador:string,
    public uidUsuarios: string[],
    public notificaciones: boolean[],
    public fechaCreacion: Date
  )
  {}
}
