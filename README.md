# 🌿 Heavens Fruits - Sistema de Gestión de Exportación

![Banner del Proyecto](docs/assets/banner_placeholder.png)
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
- **Framework**: Django 5.0+ & Django REST Framework.
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
> *Espacio para captura del Dashboard general con métricas de ventas e inventario.*
![Dashboard](docs/assets/dashboard_placeholder.png)

### Gestión de Inventarios
> *Espacio para captura de la tabla de inventarios o detalles de producto.*
![Inventario](docs/assets/inventory_placeholder.png)

### Reportes y Análisis
> *Espacio para captura de la vista de generación de reportes.*
![Reportes](docs/assets/reports_placeholder.png)

### Login y Autenticación
> *Espacio para captura de la pantalla de inicio de sesión.*
![Login](docs/assets/login_placeholder.png)

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
