# Arquitectura del Proyecto: El Rincón Del Gamer

Esta guía detalla la organización y el propósito de cada directorio en el proyecto.

## 🏗️ Organización de Archivos

### 1. Directorio Raíz
- `index.html`: Es el punto de entrada principal. Actualmente configurado para redirigir automáticamente al usuario a `auth/login.html` para asegurar el flujo de autenticación.
- `README.md`: Resumen general del proyecto.

### 2. `/src` - Lógica y Componentes
Este directorio contiene la estructura necesaria para escalar el proyecto a una arquitectura más robusta:
- `app/`: Lógica central de funcionamiento.
- `bd/`: Scripts de conexión y consultas a base de datos (preparado para integración backend).
- `components/`: Partes de la UI que pueden ser reutilizadas.
- `hooks/`: Utilidades para manejar estados o efectos recurrentes.
- `lib/`: Librerías externas o utilidades generales.

### 3. `/assets` - Recursos Estáticos
Contiene todo lo relacionado con la apariencia y la interactividad básica:
- `css/style.css`: Estilo global inspirado en una estética Cyber-Gaming.
- `js/app.js`: Script principal que maneja eventos, modales de chat y modos visuales (oscuro/claro).

### 4. `/auth` - Autenticación y Perfil
Módulo encargado de la seguridad y el acceso:
- `login.html`: Interfaz de acceso para los usuarios.
- `panel_control/`: Contiene las vistas específicas para la administración (`admin/`) y el perfil personal del usuario (`usuario/`).

### 5. `/docs` - Documentación
Espacio dedicado a la documentación técnica y del proceso de aprendizaje (Laboratorio).

## 🎨 Principios de Diseño
- **Premium Aesthetics**: El diseño utiliza gradientes suaves, efectos de glassmorphism y micro-animaciones para ofrecer una experiencia de usuario de alta calidad.
- **Responsividad**: La interfaz está pensada para adaptarse a diferentes tamaños de pantalla, priorizando la visualización en escritorio para el dashboard.
