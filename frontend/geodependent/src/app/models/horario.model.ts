export class Horario {
  constructor(
    public id: string,
    public uidUsuarios: string[],
    public diasSemana: string[],
    public horas: string[],
    public uidZona: string,
  )
  {}
}
