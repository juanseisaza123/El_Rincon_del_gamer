# El Rincón Del Gamer (ERG)

¡Bienvenido a **El Rincón Del Gamer**, la red social definitiva para apasionados de los videojuegos!

## 🚀 Descripción del Proyecto
ERG es una plataforma diseñada para que los gamers puedan interactuar, crear comunidades, compartir contenido y mantenerse al día con las últimas noticias del mundo gaming.

> [!NOTE]
> Al cargar el proyecto, el sistema redirige automáticamente a la pantalla de inicio de sesión (`auth/login.html`).

## 📂 Estructura del Proyecto
El proyecto ha sido organizado para seguir una estructura clara y profesional:

```text
El Rincon Del Gamer/
├── server.js           # Servidor Backend Express (API de Estudiantes)
├── package.json        # Dependencias y scripts del backend
├── package-lock.json   # Lockfile de dependencias Node.js
├── src/                # Lógica de la aplicación y componentes
│   ├── app/            # Lógica central
│   ├── bd/             # Configuración de base de datos
│   ├── components/     # Componentes reutilizables
│   ├── hooks/          # Hooks personalizados
│   └── lib/            # Librerías y utilidades
├── assets/             # Recursos estáticos
│   ├── css/            # Estilos CSS (Cyber-Gaming)
│   ├── js/             # Scripts JavaScript (App y conexión API)
│   └── image/          # Imágenes y Multimedia
├── auth/               # Módulo de Autenticación
│   ├── login.html      # Pantalla de Inicio de Sesión
│   └── panel_control/  # Paneles de Usuario y Administración
├── docs/               # Documentación técnica del proyecto
├── index.html          # Dashboard Principal y Gestión de Estudiantes
└── README.md           # Este archivo
```

## 🛠️ Tecnologías Utilizadas
- **HTML5**: Estructura semántica.
- **CSS3**: Diseño moderno, Flexbox, Grid, Glassmorphism y temas Gaming.
- **JavaScript (Vanilla)**: Lógica interactiva y manipulación del DOM.
- **Node.js & Express 5**: Servidor backend y API REST.
- **FontAwesome**: Iconografía.

## 🔌 API Backend Express (Puerto 3000)
Para iniciar el servidor backend:
```bash
npm install
npm start
```

### Rutas Disponibles:
- `GET /`: Mensaje de bienvenida al backend.
- `GET /estudiantes`: Listado de estudiantes registrados.
- `POST /estudiantes`: Registro de nuevo estudiante (valida `nombre`, `edad`, `correo`).
- `PUT /estudiantes/:id`: Actualización de datos del estudiante.
- `DELETE /estudiantes/:id`: Eliminación de estudiante.
- `GET /buscar?termino=...`: Búsqueda de estudiantes por nombre, juego o correo.

## 📖 Documentación Adicional
Para más detalles sobre la arquitectura y el desarrollo, consulta la carpeta `docs/`:
- [Arquitectura del Proyecto](docs/architecture.md)
- [Documentación del Laboratorio](docs/Documentacion_laboratorio.md)

## 👥 Usuarios de Muestra
Para probar las funcionalidades de la plataforma, puedes usar las siguientes credenciales:

| Rol | Usuario | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `admin` | `admin123` |
| **Usuario Regular** | `gamer` | `gamer123` |

---
*Proyecto desarrollado para el Proyecto Media 11A - 2026*
# El_Rincon_del_gamer
