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
├── server.js           # Servidor Backend Express
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
├── index.html          # Dashboard Principal
└── README.md           # Este archivo
```

## 🛠️ Tecnologías Utilizadas
- **HTML5**: Estructura semántica.
- **CSS3**: Diseño moderno, Flexbox, Grid, Glassmorphism y temas Gaming.
- **JavaScript (Vanilla)**: Lógica interactiva y manipulación del DOM.
- **Node.js & Express 5**: Servidor backend y API REST.
- **FontAwesome**: Iconografía.

## 🔌 Backend Express (Puerto 3000)
1. Edita el archivo `.env` en la raíz del proyecto. Si no existe, copia `.env.example` y nómbralo `.env`.
2. Configura `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` con la URL y la clave pública (`publishable` o `anon`) de tu proyecto Supabase.
3. En Supabase, agrega `http://localhost:3000/**` a **Authentication → URL Configuration → Redirect URLs**, para que el enlace de confirmación vuelva al login local.
4. En la terminal de VS Code, ejecuta `npm install` y luego `npm start`. Abre `http://localhost:3000/auth/login.html`.
5. El formulario permite crear una cuenta con correo y contraseña o iniciar sesión. Si Supabase pide confirmar el correo, confirma el mensaje recibido antes de entrar.

El navegador obtiene únicamente la URL y la clave pública desde `GET /api/config`; la clave pública no sustituye las políticas Row Level Security (RLS). No coloques claves `secret` o `service_role` en el frontend ni en variables `PUBLIC_`. El archivo `.env` está excluido de Git. Usa Node.js 20.6 o posterior para cargar ese archivo con los comandos incluidos.

### Explicación breve
Supabase Auth guarda las cuentas y verifica el correo y la contraseña. El cliente oficial de JavaScript se carga desde CDN; Express entrega la configuración pública desde `.env`, y el cliente llama a `signUp`, `signInWithPassword` y `signOut`. El inicio de sesión ya no acepta usuarios de muestra: se debe crear la cuenta en Supabase. La interfaz restante todavía guarda publicaciones y preferencias en `localStorage`; no significa que esos datos ya estén en la base de datos de Supabase. Para proteger tablas y datos, habilita RLS y crea políticas antes de guardar información de usuarios.

## 📖 Documentación Adicional
Para más detalles sobre la arquitectura y el desarrollo, consulta la carpeta `docs/`:
- [Arquitectura del Proyecto](docs/architecture.md)
- [Documentación del Laboratorio](docs/Documentacion_laboratorio.md)

---
*Proyecto desarrollado para el Proyecto Media 11A - 2026*
# El_Rincon_del_gamer
