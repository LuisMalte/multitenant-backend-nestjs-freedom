import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ReservationListener } from './listeners/reservation.listener';

@Module({
  // No necesitamos exportar MailService porque los eventos 
  // operan por suscripción global, no por inyección directa.
  providers: [MailService, ReservationListener],
})
export class MailModule {}