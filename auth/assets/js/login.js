document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            // Usuarios de muestra para testeo (con Roles añadidos)
            const sampleUsers = {
                'admin': {
                    password: 'admin123',
                    profile: {
                        name: "Admin ERG",
                        handle: "@erg_admin",
                        role: "admin",
                        bio: "Administrador del sistema. Control de calidad y soporte.",
                        avatar: "https://ui-avatars.com/api/?name=Admin+ERG&background=ff003c&color=fff"
                    }
                },
                'gamer': {
                    password: 'gamer123',
                    profile: {
                        name: "Gamer Pro",
                        handle: "@gamer_pro",
                        role: "user",
                        bio: "Jugador profesional de FPS. Streamer a tiempo parcial.",
                        avatar: "https://ui-avatars.com/api/?name=Gamer+Pro&background=00f3ff&color=333"
                    }
                }
            };

            // Validación de usuarios de muestra
            if (sampleUsers[username] && sampleUsers[username].password === password) {
                console.log('Login exitoso (Usuario de muestra):', { username, role: sampleUsers[username].profile.role });
                localStorage.setItem('erg_profile', JSON.stringify(sampleUsers[username].profile));
                window.location.href = '../index.html';
            } 
            // Validación genérica para otros usuarios (por defecto son 'user')
            else if (username.length > 3 && password.length >= 4) {
                console.log('Login exitoso:', { username });
                const genericProfile = {
                    name: username,
                    handle: "@" + username.toLowerCase().replace(/[^a-z0-z]/g, '_'),
                    role: "user",
                    bio: "¡Nuevo en El Rincón Del Gamer!",
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`
                };
                localStorage.setItem('erg_profile', JSON.stringify(genericProfile));
                window.location.href = '../index.html';
            } 
            else {
                alert('Por favor introduzca un correo/usuario y una contraseña válidos para iniciar sesión.');
            }
        });
    }

    const authButtons = document.querySelectorAll('.btn-auth');
    authButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('Auth button clicked:', button.textContent);
        });
    });

    createFloatingIcons();
});

/* Generador de Iconos Gamer Flotantes Masivos */
const gameIcons = [
    { name: 'discord', color: '#5865F2', svg: '<svg viewBox="0 0 640 512"><path fill="currentColor" d="M524.531 69.836a1.5 1.5 0 0 0-.764-.7A485.065 485.065 0 0 0 404.081 32a1.816 1.816 0 0 0-1.923.91 337.461 337.461 0 0 0-14.9 30.6 447.848 447.848 0 0 0-134.426 0 309.541 309.541 0 0 0-15.135-30.6 1.89 1.89 0 0 0-1.924-.91 483.689 483.689 0 0 0-119.688 37.136 1.712 1.712 0 0 0-.788.676C39.068 183.651 18.186 294.69 28.43 404.354a2.016 2.016 0 0 0 .765 1.375 487.666 487.666 0 0 0 146.825 74.189 1.9 1.9 0 0 0 2.063-.676A348.2 348.2 0 0 0 208.12 430.4a1.86 1.86 0 0 0-1.019-2.588 321.173 321.173 0 0 1-45.868-21.853 1.885 1.885 0 0 1-.185-3.126c3.082-2.309 6.166-4.711 9.109-7.137a1.819 1.819 0 0 1 1.9-.256c96.229 43.917 200.41 43.917 295.5 0a1.812 1.812 0 0 1 1.924.233c2.944 2.426 6.027 4.851 9.132 7.16a1.884 1.884 0 0 1-.162 3.126 301.407 301.407 0 0 1-45.89 21.83 1.875 1.875 0 0 0-1 2.611 391.055 391.055 0 0 0 30.014 48.815 1.864 1.864 0 0 0 2.063.7A486.048 486.048 0 0 0 611.081 405.7a1.882 1.882 0 0 0 .765-1.352c11.264-116.59-20.052-226.544-87.315-334.512zM222.491 337.58c-28.972 0-52.844-26.587-52.844-59.239s23.409-59.241 52.844-59.241c29.665 0 53.306 26.82 52.843 59.239 0 32.654-23.41 59.241-52.843 59.241zm195.38 0c-28.971 0-52.843-26.587-52.843-59.239s23.409-59.241 52.843-59.241c29.667 0 53.307 26.82 52.844 59.239 0 32.654-23.177 59.241-52.844 59.241z"/></svg>' },
    { name: 'reddit', color: '#FF4500', svg: '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M326.8 155.6c-18.1 0-32.8-14.7-32.8-32.8 0-14.7 9.8-27.1 23.3-31.5l-44.5-9.3-15.6 73.1c18.5 3.3 35.8 9.3 52 17.5-12.2 11.1-20.2 27.2-20.2 45.2 0 4.7.7 9.3 2.1 13.6-26.9-5.1-57.1-5.1-84 0 1.3-4.3 2.1-8.9 2.1-13.6 0-18-8.1-34.1-20.2-45.2 16.2-8.2 33.5-14.2 52-17.5l-16-75.1c-.6-2.8 1.2-5.5 4-6.1l70.1-14.6c1.1-.2 2.2 0 3.2.5s1.6 1.4 1.9 2.5l19.1 89.6c13.2-6.6 28.5-6.6 41.7 0 1.2-4.5 1.9-9.1 1.9-13.8 0-33.1-26.9-60-60-60m-201.3 22.3c0-10.2 8.3-18.5 18.5-18.5 10.2 0 18.5 8.3 18.5 18.5 0 10.2-8.3 18.5-18.5 18.5-10.2 0-18.5-8.3-18.5-18.5m201.3 0c0-10.2 8.3-18.5 18.5-18.5 10.2 0 18.5 8.3 18.5 18.5 0 10.2-8.3 18.5-18.5 18.5-10.2 0-18.5-8.3-18.5-18.5m-155.1 48.7c13.8 0 25 11.2 25 25s-11.2 25-25 25-25-11.2-25-25 11.2-25 25-25m107.6 0c13.8 0 25 11.2 25 25s-11.2 25-25 25-25-11.2-25-25 11.2-25 25-25m-144.1 63.3c35.6 35.6 92.2 35.6 127.8 0 2-2 5.3-2 7.3 0 2 2 2 5.3 0 7.3-39.6 39.6-102.8 39.6-142.4 0-2-2-2-5.3 0-7.3 2-2 5.3-2 7.3 0"/></svg>' },
    { name: 'roblox', color: '#FFFFFF', svg: '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M115,70 L435,160 L345,480 L25,390 Z M270,300 L300,260 L260,230 L230,270 Z"/></svg>' },
    { name: 'minecraft', color: '#4CAF50', svg: '<svg viewBox="0 0 512 512"><rect x="0" y="0" width="512" height="512" fill="currentColor" fill-opacity="0.1"/><rect x="96" y="128" width="96" height="96" fill="currentColor"/><rect x="320" y="128" width="96" height="96" fill="currentColor"/><rect x="192" y="224" width="128" height="192" fill="currentColor"/><rect x="128" y="288" width="64" height="128" fill="currentColor"/><rect x="320" y="288" width="64" height="128" fill="currentColor"/></svg>' },
    { name: 'fortnite', color: '#00E4FF', svg: '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M120,40 L380,40 L340,140 L190,140 L160,240 L300,240 L260,340 L130,340 L80,470 L0,470 Z"/></svg>' },
    { name: 'twitch', color: '#9146FF', svg: '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M44.9 50l-28.8 74.4v260h86.4v74.4h72l57.6-74.4h96l144-144V50H44.9zm388.8 259.2l-86.4 86.4h-96l-57.6 74.4v-74.4H131.3V86h302.4v223.2z"/><path fill="currentColor" d="M374.4 129.6H331.2v115.2h43.2V129.6zm-115.2 0h-43.2v115.2h43.2V129.6z"/></svg>' },
    { name: 'gamepad-neon', color: '#00f3ff', svg: '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M483.6 156.4L445.4 75.1c-13.6-28.7-41.9-43.1-69.6-43.1-4.8 0-9.6 .7-14.3 2L256 64 150.5 34.1c-4.7-1.3-9.5-2-14.3-2-27.7 0-56 14.4-69.6 43.1L28.4 156.4c-35 73.8-31 161.9 14.1 230.1 24.3 36.6 65.5 58.7 109.8 61.5h1.7c35.6 0 69.3-17.7 89.1-47.5L256 384l12.9 16.5c19.8 29.8 53.5 47.5 89.1 47.5h1.7c44.3-2.8 85.5-24.9 109.8-61.5 45.1-68.2 49.1-156.2 14.1-230.1zm-324 100.1c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm0-96c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm160-32c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm96 32c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm0-96c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z"/></svg>' },
    { name: 'ro2-magenta', color: '#ff00e5', svg: '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M115,70 L435,160 L345,480 L25,390 Z M270,300 L300,260 L260,230 L230,270 Z"/></svg>' },
    { name: 'mi2-yellow', color: '#ffeb3b', svg: '<svg viewBox="0 0 512 512"><rect x="0" y="0" width="512" height="512" fill="currentColor" fill-opacity="0.1"/><rect x="96" y="128" width="96" height="96" fill="currentColor"/><rect x="320" y="128" width="96" height="96" fill="currentColor"/><rect x="192" y="224" width="128" height="192" fill="currentColor"/><rect x="128" y="288" width="64" height="128" fill="currentColor"/><rect x="320" y="288" width="64" height="128" fill="currentColor"/></svg>' },
    { name: 'fo2-green', color: '#76ff03', svg: '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M120,40 L380,40 L340,140 L190,140 L160,240 L300,240 L260,340 L130,340 L80,470 L0,470 Z"/></svg>' }
];

function createFloatingIcons() {
    const container = document.getElementById('floatingElements');
    if (!container) return;

    const numIcons = 50; 

    for (let i = 0; i < numIcons; i++) {
        const iconData = gameIcons[Math.floor(Math.random() * gameIcons.length)];
        const iconEl = document.createElement('div');
        iconEl.className = 'float-icon';
        iconEl.innerHTML = iconData.svg;
        iconEl.style.color = iconData.color;

        const left = Math.random() * 95; 
        const size = Math.random() * 50 + 25; 
        const duration = Math.random() * 20 + 10; 
        const delay = -Math.random() * duration; 
        
        iconEl.style.width = `${size}px`;
        iconEl.style.height = `${size}px`;
        iconEl.style.left = `${left}%`;
        iconEl.style.animationDuration = `${duration}s`;
        iconEl.style.animationDelay = `${delay}s`;

        container.appendChild(iconEl);
    }
}
