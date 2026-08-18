/**
 * Evento de dominio emitido asíncronamente tras la creación de una reserva.
 * Contiene estrictamente las llaves primarias necesarias para rehidratar
 * los datos en el Listener, reduciendo la carga de memoria.
 */

export class ReservationCreatedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly reservationId: string,
    public readonly customerId: string,
  ) {}
}