import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';


/**
 * Módulo global de registro de eventos (Logging).
 * Configura `nestjs-pino` de forma asíncrona basándose en el entorno de ejecución.
 */
@Global()
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],

      inject: [ConfigService], // Inyecta las variables de entorno previamente validadas

      useFactory: (configService: ConfigService) => {
        const environment = configService.getOrThrow<string>('app.environment');
        return {
          pinoHttp: {
            level: configService.getOrThrow<string>('logger.level'),
            transport:
            // Estrategia de formato según entorno:
            // Producción: JSON puro (optimizado para rendimiento y sistemas de monitoreo).
            // Desarrollo/Test: Formato humanamente legible con colores (pino-pretty).
              environment === 'production'
                ? undefined
                : {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      singleLine: true,
                      translateTime: 'HH:MM:ss',
                    },
                  },
          },
        };
      },
    }),
  ],
  exports: [PinoLoggerModule], // Expone el logger configurado al resto de la aplicación
  
})
export class LoggerModule {}