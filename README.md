# 🌿 Heavens Fruits - Sistema de Gestión de Exportación

<img width="2510" height="1368" alt="image" src="https://github.com/user-attachments/assets/ff469916-1534-495c-983d-56fe05f962e4" />

*El sistema integral para la gestión, control y exportación de frutas exóticas.*

## 📋 Descripción

**Heavens Fruits System** es una plataforma web moderna y robusta diseñada para optimizar todo el ciclo de vida de una empresa exportadora de frutas. Desde la adquisición de materia prima a proveedores nacionales hasta la venta internacional, pasando por un estricto control de inventarios, costos y facturación.

El sistema está construido con una arquitectura desacoplada, utilizando **Django REST Framework** para un backend potente y seguro, y **Next.js** para una experiencia de usuario frontend rápida, responsiva y estética.

## 🚀 Características Principales

### 🍎 Gestión Comercial y Operativa
- **Dashboard Interactivo**: Visualización de métricas clave, ventas y alertas en tiempo real.
- **Gestión de Pedidos**: Flujo completo desde la orden de compra hasta la facturación.
- **Compras Nacionales**: Módulo dedicado `nacionales` para el control de proveedores locales, precios por kilo y calidad de fruta.
- **Inventarios**: Control en tiempo real de stock, lotes y trazabilidad (`inventarios`).

### 📊 Análisis y Reportes
- **Reportes Financieros**: Análisis de costos, utilidades y márgenes por exportación.
- **Exportación de Datos**: Generación de reportes en PDF y Excel para la toma de decisiones.
- **Estado de Cuenta**: Seguimiento de deudas y pagos de clientes (e.g., `estado_cuenta_clientes.xlsx`).

### 🔐 Seguridad y Accesibilidad
- **Autenticación Robusta**: Sistema de login seguro con manejo de roles y permisos (`autenticacion`).
- **Diseño Responsivo**: Interfaz adaptada a dispositivos móviles y de escritorio.

## 🛠️ Stack Tecnológico

### Backend (API)
- **Framework**: Django 6.0+ & Django REST Framework.
- **Base de Datos**: PostgreSQL (Recomendado) / SQLite (Dev).
- **Seguridad**: JWT Auth, CORS headers.
- **Herramientas**: `django-import-export`, `reportlab` (PDFs), `pandas` (Análisis de datos).

### Frontend (Cliente)
- **Framework**: Next.js 15+ (App Router).
- **Lenguaje**: TypeScript.
- **Estilos**: Tailwind CSS.
- **Componentes**: Shadcn/UI, Radix UI.
- **Estado & Formularios**: React Hook Form, Zod, TanStack Query.
- **Gráficos**: Recharts.

## 📸 Galería del Proyecto

A continuación se muestra una vista previa de la plataforma.

### Dashboard Principal

<img width="2542" height="1350" alt="image" src="https://github.com/user-attachments/assets/31f90384-715f-49b7-95ae-2569f89ed5ec" />

<img width="2507" height="1186" alt="image" src="https://github.com/user-attachments/assets/7fef1e71-eaca-4dd0-8d3c-2d6e44dfd957" />



### Gestión de Inventarios

<img width="2558" height="1325" alt="image" src="https://github.com/user-attachments/assets/643aac34-e3a6-4f94-b755-ea134aef5f38" />


### Reportes y Análisis
<img width="2556" height="1353" alt="image" src="https://github.com/user-attachments/assets/5aed0c7d-5305-49db-980f-937f89bca253" />

<img width="1941" height="1377" alt="image" src="https://github.com/user-attachments/assets/ce9e66f1-1b12-4cdc-8d54-3f59e1bd7048" />

<img width="2538" height="1348" alt="image" src="https://github.com/user-attachments/assets/d088cba3-fd11-4c29-90e6-3614483c22b9" />


### Gestion De Pedidos:
<img width="2547" height="1381" alt="image" src="https://github.com/user-attachments/assets/2db6f180-2927-403c-acfd-1cad4b3b7802" />
<img width="2556" height="922" alt="image" src="https://github.com/user-attachments/assets/55b2d665-6574-4b3b-9c03-4656557a8c85" />


### Gestion De Calidad Y Nacionales:
<img width="2472" height="1270" alt="image" src="https://github.com/user-attachments/assets/cc5c1f46-c7d9-4b1e-b774-8b12c3659777" />
<img width="1416" height="1042" alt="image" src="https://github.com/user-attachments/assets/fbd8745a-83cc-406a-a6cc-2830b1bc7345" />



### Login y Autenticación

<img width="2551" height="1372" alt="image" src="https://github.com/user-attachments/assets/35db40aa-446f-48e9-9997-4e4204faff72" />

<img width="2487" height="1301" alt="image" src="https://github.com/user-attachments/assets/c223b2fa-eba4-42c1-9fcf-6875e2063eab" />



## 🔧 Instalación y Despliegue

Sigue estos pasos para ejecutar el proyecto en tu entorno local.

### Prerrequisitos
- Python 3.10+
- Node.js 18+
- PostgreSQL (Opcional, sqlite por defecto)

### 1. Configuración del Backend

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd django-server

# Crear entorno virtual
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Migraciones de base de datos
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Correr servidor de desarrollo
python manage.py runserver
```
El backend estará disponible en `http://localhost:8000`.

### 2. Configuración del Frontend

```bash
# Navegar a la carpeta frontend
cd frontend

# Instalar dependencias
npm install 
# o
pnpm install

# Correr servidor de desarrollo
npm run dev
```
El frontend estará disponible en `http://localhost:3000`.

## 📂 Estructura del Proyecto

```
django-server/
│
├── autenticacion/      # App de usuarios y permisos
├── comercial/          # Lógica de ventas y clientes
├── inventarios/        # Gestión de stock y bodegas
├── nacionales/         # Compras y proveedores locales
├── mysite/             # Configuración principal de Django
├── frontend/           # Aplicación Next.js
│   ├── src/
│   │   ├── app/        # Rutas y páginas
│   │   ├── components/ # Componentes reutilizables
│   │   └── lib/        # Utilidades
│
└── manage.py           # Entry point de Django
```

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, abre un issue para discutir cambios mayores antes de enviar un Pull Request.

---
© 2026 Heavens Fruits. Todos los derechos reservados.
