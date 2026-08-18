import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';

import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { TenantConnectionManager } from '../../../infrastructure/database';
import { TenantDatabaseConfig } from '../../../infrastructure/database/tenant-database.config';
import { ReservationCreatedEvent } from '../../reservations/events/reservation-created.event';
import { MailService } from '../mail.service';

@Injectable()
export class ReservationListener {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly tenantConnectionManager: TenantConnectionManager,
    private readonly mailService: MailService,
    private readonly logger: Logger,
  ) {}

  /**
   * Suscripción al evento emitido por ReservationsService.
   * Se ejecuta de forma asíncrona ({ async: true }) para no bloquear el Event Loop.
   */
  @OnEvent('reservation.created', { async: true })
  async handleReservationCreated(event: ReservationCreatedEvent) {
    this.logger.log({ event }, 'Procesando evento en segundo plano: reservation.created');

    try {
      // 1. Consultar credenciales en la Base de Datos Maestra
      const tenantMasterRecord = await this.prismaService.tenant.findUnique({
        where: { id: event.tenantId },
      });

      if (!tenantMasterRecord || tenantMasterRecord.status !== 'ACTIVE') {
        this.logger.warn({ tenantId: event.tenantId }, 'Tenant no encontrado o inactivo. Abortando envío.');
        return;
      }

      // 2. Mapear al contrato estricto exigido por tu infraestructura
      const dbConfig: TenantDatabaseConfig = {
        host: tenantMasterRecord.databaseHost,
        port: tenantMasterRecord.databasePort,
        name: tenantMasterRecord.databaseName,
        user: tenantMasterRecord.databaseUser,
        password: tenantMasterRecord.databasePassword,
      };

      // 3. Levantar conexión efímera a la base de datos del cliente
      const tenantClient = await this.tenantConnectionManager.getClient(event.tenantId,
        dbConfig);

      // 4. Extraer el correo del cliente desde la base de datos del Tenant
      const customer = await tenantClient.customer.findUnique({
        where: { id: event.customerId },
      });

      if (!customer) {
        this.logger.warn({ customerId: event.customerId }, 'Cliente no encontrado en DB del Tenant. Abortando correo.');
        return;
      }

      // CORRECCIÓN ERROR 2: Validar la existencia de correo antes de notificar
      if (!customer.email) {
        this.logger.warn(
          { customerId: event.customerId }, 
          'El cliente no tiene un correo electrónico registrado. Omitiendo notificación.'
        );
        return;
      }

      // 5. Delegar el envío a Resend
      await this.mailService.sendReservationConfirmation(
        customer.email,
        customer.name,
        event.reservationId,
      );

    } catch (error) {
      this.logger.error({ err: error, event }, 'Error crítico procesando el evento de reserva');
    }
  }
}