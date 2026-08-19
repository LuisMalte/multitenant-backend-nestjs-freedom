# ==========================================
# ETAPA 1: CONSTRUCCIÓN (BUILDER)
# ==========================================
FROM node:22-alpine AS builder

# Prisma requiere OpenSSL para funcionar correctamente en Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app

# Copiamos primero solo los archivos de dependencias para aprovechar el caché de Docker
COPY package*.json ./

# Instalamos TODAS las dependencias (incluyendo las de desarrollo para compilar)
RUN npm ci

# Copiamos el resto del código fuente (Esto incluye tus carpetas con los esquemas de Prisma)
COPY . .

# CORRECCIÓN CRÍTICA: Generamos los clientes de Prisma DENTRO del contenedor
# Este bucle busca cualquier archivo .prisma en tu proyecto y genera los tipos
# antes de que TypeScript intente compilar.
RUN for schema in $(find . -name "*.prisma"); do npx prisma generate --schema=$schema; done

# Ahora sí, compilamos la aplicación de TypeScript a JavaScript.
RUN npm run build

# ==========================================
# ETAPA 2: PRODUCCIÓN (RUNNER)
# ==========================================
FROM node:22-alpine AS production
WORKDIR /app


RUN apk add --no-cache openssl



# Copiamos solo los manifiestos de dependencias
COPY package*.json ./

# Instalamos SOLO las dependencias de producción (ignoramos las devDependencies)
RUN npm ci --omit=dev

# 
COPY --from=builder /app/prisma ./prisma

# Copiamos la carpeta 'dist' (código compilado) desde la etapa 1
COPY --from=builder /app/dist ./dist

# Copiamos la carpeta 'generated' (donde viven los clientes de Prisma recién creados)
COPY --from=builder /app/generated ./generated

# Por seguridad, cambiamos al usuario 'node' sin privilegios de root
USER node

# Exponemos el puerto de la API
EXPOSE 3000

# Arrancamos la aplicación directamente desde el binario de Node (más rápido que npm)
CMD ["node", "dist/src/main.js"]