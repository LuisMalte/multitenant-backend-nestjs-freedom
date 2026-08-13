export default () => ({
  app: {
    name: process.env.APP_NAME,
    port: Number(process.env.APP_PORT),
    environment: process.env.NODE_ENV,
  },

  database: {
    master: {
      host: process.env.MASTER_DATABASE_HOST,
      port: Number(process.env.MASTER_DATABASE_PORT),
      name: process.env.MASTER_DATABASE_NAME,
      user: process.env.MASTER_DATABASE_USER,
      password: process.env.MASTER_DATABASE_PASSWORD,
    },
  },



  tenancy: {
    connectionTtlMs: Number(process.env.TENANT_CONNECTION_TTL_MS),
  },

  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },

  mail: {
    resendApiKey: process.env.RESEND_API_KEY,
  },

  logger: {
    level: process.env.LOG_LEVEL,
  },
});