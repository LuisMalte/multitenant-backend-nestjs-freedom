¡Claro que sí! Vamos a preparar un `README.md` profesional, completo y estructurado para tu repositorio.

Como recordatorio clave de tu arquitectura, este proyecto utiliza una aproximación avanzada con **NestJS Multi-Tenant (Database-per-Tenant)**, **Arquitectura Orientada a Eventos con Resend**, **Health Checks con Terminus**, **Logs estructurados con Pino**, documentación moderna mediante **Scalar** (en lugar de Swagger tradicional) y despliegue inmutable con **Docker Multi-Stage Build**.

Aquí tienes la estructura y el contenido exacto que debes copiar y pegar en tu archivo `README.md` en la raíz de tu proyecto:

---

# 🚀 CourtReserve Multi-Tenant SaaS Backend

Backend desarrollado con **NestJS** bajo una arquitectura robusta **Multi-Tenant (Database-per-Tenant)**, diseñado para garantizar el aislamiento de datos por cliente, escalabilidad, alta observabilidad y procesos asíncronos en segundo plano.

---

## 🏗️ Arquitectura y Características Principales

* **Multi-Tenancy (Database-per-Tenant):** Gestión dinámica de bases de datos por cada cliente a través de un `TenantConnectionManager` respaldado por caché en memoria para optimizar conexiones efímeras.
* **Arquitectura Orientada a Eventos (EDA):** Procesamiento asíncrono en segundo plano mediante `EventEmitter2` para notificaciones por correo electrónico sin bloquear el *Event Loop* principal.
* **Proveedor de Correo:** Integración con la API de **Resend** para el envío de confirmaciones transaccionales de reservas.
* **Monitoreo y Salud (Health Checks):** Endpoint de observabilidad implementado con `@nestjs/terminus` para evaluar la conectividad en vivo con la Base de Datos Maestra.
* **Logging Estructurado:** Trazabilidad avanzada de peticiones y errores utilizando `nestjs-pino`.
* **Documentación Moderna:** API interactiva documentada utilizando **Scalar** (`@scalar/nestjs-api-reference`).
* **Contenedorización de Producción:** Imagen de Docker optimizada mediante **Multi-Stage Build** con generación dinámica de clientes Prisma y purga de dependencias de desarrollo (`devDependencies`).

---

## 🛠️ Requisitos Previos

Asegúrate de contar con las siguientes herramientas instaladas en tu entorno local:

* **Node.js** (Versión 20+ recomendada)
* **Docker y Docker Compose**
* **npm** o gestor de paquetes compatible

---

## ⚙️ Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basándote en la siguiente estructura:

```env
# Configuración de la Aplicación
PORT=3000
NODE_ENV=development

# Base de Datos Maestra (Master DB)
MASTER_DATABASE_HOST=postgres
MASTER_DATABASE_PORT=5432
MASTER_DATABASE_NAME=courtreserve_master
MASTER_DATABASE_USER=postgres
MASTER_DATABASE_PASSWORD=tu_password_seguro

# Seguridad / JWT
JWT_SECRET=tu_jwt_secret_super_seguro
JWT_EXPIRES_IN=1d

# Infraestructura de Correo (Resend)
RESEND_API_KEY=re_tu_api_key_de_resend

```

*(Nota: Si ejecutas la base de datos de manera local fuera de Docker, recuerda cambiar `MASTER_DATABASE_HOST=localhost`).*

---

## 🐳 Despliegue con Docker (Recomendado para Producción)

La forma más limpia y automatizada de levantar todo el ecosistema (Base de Datos PostgreSQL + Contenedor de la API optimizado) es utilizando Docker Compose.

1. Construye y levanta los servicios en segundo plano:
```bash
docker compose up --build -d

```


2. Verifica que los contenedores estén corriendo y saludables:
```bash
docker compose ps

```


3. Revisa los logs en tiempo real de la API:
```bash
docker compose logs -f api

```


4. Para detener los servicios:
```bash
docker compose down

```



---

## 💻 Ejecución Local (Desarrollo)

Si prefieres ejecutar la aplicación localmente para fines de desarrollo:

1. Instala las dependencias:
```bash
npm install

```


2. Genera los clientes de Prisma (Master y Tenant):
```bash
npx prisma generate --schema=prisma/master/schema.prisma
npx prisma generate --schema=prisma/tenant/schema.prisma

```


3. Inicia el servidor en modo *watch*:
```bash
npm run start:dev

```



---

## 📦 Colección de Peticiones HTTP (`requests.http`)

Para facilitar las pruebas de los endpoints de la API (Creación de Tenants, Autenticación JWT, Clientes, Canchas y Reservas que disparan el evento de correo en segundo plano), puedes utilizar la extensión **REST Client** de VS Code empleando el archivo `requests.http` incluido en la raíz del repositorio.

Principales flujos probados:

* `POST /api/v1/tenants` (Aprovisionamiento de nuevos tenants)
* `POST /api/v1/auth/login` (Autenticación administrativa)
* `POST /api/v1/customers` (Gestión de clientes por tenant)
* `POST /api/v1/courts` (Gestión de canchas)
* `POST /api/v1/reservations` **(Dispara el evento asíncrono de correo vía Resend)**
* `GET /api/v1/health` (Health Check de la Master DB y la aplicación)

---

## 📄 Documentación Interactiva (Scalar)

Una vez que la aplicación esté corriendo, puedes acceder a la interfaz interactiva de la API basada en **Scalar** navegando a:

```text
http://localhost:3000/api/v1/docs

```

*(O la ruta configurada en tu main.ts para la documentación).*