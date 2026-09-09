# Documentación del Laboratorio: El Rincón Del Gamer (ERG)

## 1. Descripción General del Proyecto
"El Rincón Del Gamer" (ERG) es una plataforma web y red social diseñada específicamente para la comunidad de jugadores. El proyecto busca ofrecer un espacio donde los usuarios puedan explorar, crear comunidades, realizar publicaciones y chatear entre ellos.

## 2. Stack Tecnológico del Frontend
La tecnología que emplearemos para iniciar y estructurar el **frontend** se basa en los estándares de la web clásica sin depender inicialmente de frameworks pesados:

- **HTML5**: Utilizado para la semántica y estructura de las páginas, incorporando elementos modernos de diseño estructurado.
- **CSS3**: Empleado para la maquetación visual (Flexbox/Grid), efectos dinámicos, modos visuales (como interacciones de dark mode) y un diseño fuertemente orientado a temas gaming con acentos de color vibrantes.
- **JavaScript (Vanilla)**: Se utiliza para dominar la interactividad del lado del cliente, gestionar modales (como el chat emergente), navegación del dashboard de usuario y futuras peticiones de inicio de sesión de forma nativa.

## 3. Estructura de Archivos y Directorios Principal
A continuación, un mapeo de la estructura base del proyecto:

- `/index.html`: La vista principal (Dashboard). Contiene la barra de navegación, el menú lateral (sidebar), la sección central (feed) para crear publicaciones y el modal de chat integrado.
- `/auth/login.html`: Vista diseñada para la autenticación de usuarios. Incluye formularios de inicio de sesión y enlaces de registro.
- `/assets/`: Contiene los recursos estáticos del portal.
  - `/assets/css/style.css`: Hoja de estilos global responsable del diseño principal.
  - `/assets/css/login.css`: Hoja de estilos específica para la pantalla de inicio de sesión.
  - `/assets/js/app.js`: Script principal donde se gestiona la lógica de la interfaz de usuario, eventos de botones (modo oscuro, apertura/cierre de modales de chat, e interacciones del sidebar).
  - `/assets/js/login.js`: Lógica específica para el manejo de la autenticación.
- `/docs/`: Carpeta destinada a agrupar la información y guías relativas a la técnica y desarrollo del proyecto (donde reside este documento).

## 4. Funcionalidades Clave Implementadas (UI/UX)
1. **Sistema de Navegación Lateral (Sidebar)**: Menú interactivo que resalta el apartado activo (Principal, Explorar, Crear comunidad).
2. **Sistema de Feed**: Área para publicar estados y visualizar actualizaciones de la red social.
3. **Chat Emergente (Modal)**: Un sistema de mensajería superpuesto en el dashboard que lista mensajes de grupos (Ej: "Comunidad VR") y chats privados. Se oculta e invoca mediante un botón específico en la barra principal.
4. **Plantilla de Autenticación Dinámica**: Fondos coloridos (`#loginForm`) con botones claros para el acceso.

Este documento servirá como la base arquitectónica y de referencia para los próximos pasos en el desarrollo y laboratorio del proyecto ERG.
