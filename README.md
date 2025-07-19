# 🏨 Hotel Booking Platform - Multi-Tenant Web App

Este es un sistema de reservas de hoteles desarrollado como una aplicación web **multi-tenant**, donde múltiples hoteles pueden registrarse en la plataforma y gestionar su información y reservas de forma independiente. Cada hotel tiene su propia vista personalizada accesible por los usuarios finales.

---

## 🧩 Tecnologías utilizadas

### 🖥️ Frontend
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- JavaScript
- [TailwindCSS](https://tailwindcss.com/)
- [React Bootstrap](https://react-bootstrap.github.io/)
- **Desplegado en:** [Amazon S3](https://aws.amazon.com/s3/) como sitio estático

### ⚙️ Backend (Carpeta `backend`)
Desarrollado con arquitectura **serverless** en AWS utilizando:

- **AWS Lambda** – Funciones backend sin servidor
- **API Gateway** – Gestión de las rutas y endpoints
- **DynamoDB** – Base de datos NoSQL
- **CloudWatch** – Visualización de logs y monitoreo
- **Serverless Framework** – Automatización del despliegue de funciones

El backend está organizado por dominios funcionales (microservicios):

#### 📁 Service
Módulo para la gestión de servicios ofrecidos por los hoteles (spa, desayuno, tours, etc.).

#### 📁 Reservation
Manejo de reservas de habitaciones por usuarios. Incluye funciones por ID de usuario, hotel o tenant.

#### 📁 Room
Módulo en Python para manejar las habitaciones disponibles, su disponibilidad, creación, actualización, etc.

#### 📁 Hotel
Gestión de la información de los hoteles registrados, búsquedas por ubicación o nombre, entre otras funciones.

#### 📁 Payment
Módulo para procesar y consultar pagos realizados por los usuarios.

#### 📁 Comment
Gestión de comentarios de usuarios sobre habitaciones. Incluye consultas por usuario o habitación.

---

## 🚀 Despliegue

### Scripts disponibles
En la raíz del backend hay varios scripts de despliegue:

- `deploy.sh`: Despliegue general
- `deploy-prod.sh`: Despliegue a producción
- `deploy-test.sh`: Despliegue a entorno de pruebas

Cada microservicio cuenta con su archivo `serverless.yml`, permitiendo el despliegue automático con el **Serverless Framework** en AWS.

### Logs y monitoreo
- Todos los logs de las funciones Lambda pueden ser visualizados en **AWS CloudWatch**.

---

## 🧠 Características principales

- 🔐 **Multi-tenancy**: Separación de datos por hotel. Cada hotel puede administrar sus propios datos sin interferir con otros.
- 🧾 **Reservas de habitaciones**: Usuarios pueden hacer reservas dependiendo de la disponibilidad.
- 💳 **Pagos integrados**: Sistema de pagos por reservas.
- 💬 **Comentarios de usuarios**: Feedback sobre habitaciones.
- 🧹 **Arquitectura limpia**: Separación de responsabilidades por carpetas/módulos.
- 🌐 **Frontend dinámico**: Interfaces atractivas y responsivas usando React, Tailwind y Bootstrap.
