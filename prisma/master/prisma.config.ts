// prisma/master/prisma.config.ts

import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './schema.prisma',
  migrations: {
    path: './migrations',
  },
  datasource: {
    url: `postgresql://${process.env.MASTER_DATABASE_USER}:${process.env.MASTER_DATABASE_PASSWORD}@${process.env.MASTER_DATABASE_HOST}:${process.env.MASTER_DATABASE_PORT}/${process.env.MASTER_DATABASE_NAME}`,
  },
});