import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resendClient: Resend;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    // Inyección de la llave desde tu archivo de configuración (configuration.ts)
    const apiKey = this.configService.getOrThrow<string>('mail.resendApiKey');
    this.resendClient = new Resend(apiKey);
  }

  /**
   * Envía un correo transaccional de confirmación de reserva.   */
  async sendReservationConfirmation(
    toEmail: string,
    customerName: string,
    reservationId: string,
  ): Promise<void> {
    try {
      const response = await this.resendClient.emails.send({
        from: 'onboarding@resend.dev', // Dominio de pruebas por defecto
        to: toEmail,
        subject: 'Confirmación de tu Reserva - CourtReserve',
        html: `
          <h2>¡Hola ${customerName}!</h2>
          <p>Tu reserva ha sido confirmada en nuestro sistema.</p>
          <p><strong>ID de Reserva:</strong> ${reservationId}</p>
          <hr/>
          <p><small>Este es un correo automático generado por CourtReserve SaaS.</small></p>
        `,
      });

      this.logger.log({ emailId: response.data?.id, toEmail }, 'Email de confirmación enviado');
    } catch (error) {
      // No lanzamos la excepción para no romper el hilo secundario. 
      // Simplemente registramos la falla para observabilidad.
      this.logger.error({ err: error, toEmail }, 'Fallo al enviar correo mediante Resend');
    }
  }
}