# Documentación del Proyecto: El Rincón Del Gamer

## Estructura Actual del Proyecto

El proyecto está organizado para separar claramente los recursos públicos, la lógica de la aplicación y la documentación técnica.

```text
El Rincon Del Gamer/
├── src/                   # Código fuente principal de la aplicación
│   ├── app/               # Lógica de la aplicación central
│   ├── bd/                # Configuración y consultas de base de datos
│   ├── components/        # Componentes reutilizables
│   ├── hooks/             # Utilidades o hooks personalizados
│   └── lib/               # Librerías o utilidades adicionales
├── assets/                # Archivos estáticos globales (css/, js/)
├── auth/                  # Módulo de autenticación (login.html, panel_control/)
├── docs/                  # Documentación técnica y de laboratorio
├── index.html             # Punto de entrada (Dashboard)
└── README.md              # Guía rápida del proyecto
```

## Tecnologías Principales
El desarrollo se sustenta en tecnologías estándares de la web para garantizar velocidad y compatibilidad:

- **HTML5:** Estructura y semántica.
- **CSS3:** Diseño, maquetado y estilos visuales avanzados con estética gamer.
- **JavaScript (Vanilla):** Lógica del lado del cliente, manipulación del DOM y validaciones.

## Configuración de Inicio
El proyecto está configurado para iniciar directamente en la pantalla de autenticación. Esto se logra mediante una redirección en `index.html` que apunta a `auth/login.html`.

## Seguridad y Protección de Rutas
La aplicación utiliza un sistema de "pseudo-sesión" basado en `localStorage` para proteger el acceso al Dashboard:

1. **Verificación de Sesión:** Al cargar `index.html`, un script verifica la existencia de la clave `erg_profile`. Si no existe, redirige automáticamente a la pantalla de inicio de sesión.
2. **Persistencia:** Al iniciar sesión exitosamente, los datos del perfil se guardan en el navegador, permitiendo el acceso.
3. **Cierre de Sesión:** El botón "Cerrar sesión" limpia todos los datos almacenados y redirige al usuario de vuelta al login, invalidando el acceso inmediato al Dashboard.

> [!IMPORTANT]
> Al ser una aplicación puramente frontend, esta protección es a nivel de interfaz. En un entorno de producción real, este mecanismo debe estar respaldado por tokens (JWT) y validaciones del lado del servidor.

## Sistema de Roles y Vistas
La plataforma ahora distingue entre dos roles principales:

1. **Administrador (`admin`):**
   - Tiene acceso al **Dashboard de Estadísticas Globales** (Usuarios online, total posts, etc.).
   - Dispone de un enlace directo al **Panel de Administración** (`auth/panel_control/admin/`).
2. **Usuario Regular (`user`):**
   - Interfaz simplificada sin estadísticas globales.
   - Enlace a **Mi Configuración** (`auth/panel_control/usuario/`) para gestionar ajustes personales.

Este sistema se gestiona mediante la propiedad `role` dentro del objeto de perfil guardado en `localStorage`.

## Próximos Pasos
Con esta estructura consolidada, el desarrollo continuará expandiendo las funcionalidades del `Dashboard`, refinando el sistema de `Chat` e integrando el manejo de bases de datos desde el directorio `src/bd/`.
