// Centraliza las exportaciones para simplificar su consumo en otras partes del 
// sistema.

//Exporta la configuración base bajo el alias 'configuration'
export { default as configuration } from './configuration';

/** Exporta la función de validación estricta de variables de entorno. */
export { validate } from './env.validation';