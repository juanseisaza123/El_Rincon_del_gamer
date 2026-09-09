const express = require("express");
const app = express();

// Middleware para procesar cuerpos JSON
app.use(express.json());

// Middleware CORS para permitir solicitudes desde el frontend (puerto 8000 o file://)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

// Servir archivos estáticos del proyecto frontend
app.use(express.static(__dirname));

const port = 3000;

// Base de datos en memoria para Estudiantes
let estudiantes = [
    {
        id: 1,
        nombre: "Ana",
        edad: 19,
        correo: "ana@correo.com",
        rango: "Diamante",
        juego: "Valorant",
        avatar: "https://ui-avatars.com/api/?name=Ana&background=ff00e5&color=fff"
    },
    {
        id: 2,
        nombre: "Carlos",
        edad: 21,
        correo: "carlos@correo.com",
        rango: "Maestro",
        juego: "League of Legends",
        avatar: "https://ui-avatars.com/api/?name=Carlos&background=00f3ff&color=000"
    }
];

let nextId = 3;

// 1. Ruta de Bienvenida al Backend
app.get("/", (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Backend ERG - API Estudiantes</title>
                <style>
                    body { background: #0b0e14; color: #00f3ff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
                    .card { background: rgba(20, 26, 38, 0.9); border: 2px solid #00f3ff; box-shadow: 0 0 25px rgba(0, 243, 255, 0.3); border-radius: 16px; padding: 40px; max-width: 500px; }
                    h1 { color: #fff; margin-bottom: 10px; font-size: 26px; }
                    p { color: #a3a6aa; font-size: 15px; }
                    .badge { background: #ff00e5; color: #fff; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 13px; text-transform: uppercase; }
                    .btn { display: inline-block; margin-top: 25px; padding: 12px 24px; background: linear-gradient(135deg, #00f3ff, #0051ff); color: #000; text-decoration: none; font-weight: bold; border-radius: 8px; transition: transform 0.2s; }
                    .btn:hover { transform: scale(1.05); }
                </style>
            </head>
            <body>
                <div class="card">
                    <span class="badge">🎮 Backend Activo</span>
                    <h1>El Rincón Del Gamer</h1>
                    <p>Hola, este es mi primer backend corriendo en el puerto <strong>${port}</strong>.</p>
                    <a href="/index.html" class="btn">Ir al Dashboard Principal</a>
                </div>
            </body>
        </html>
    `);
});

// 2. Obtener lista de estudiantes
app.get("/estudiantes", (req, res) => {
    console.log(`[ERG-SERVER] GET /estudiantes - Listando ${estudiantes.length} estudiantes.`);
    res.json(estudiantes);
});

// 3. Registrar nuevo estudiante con validaciones
app.post("/estudiantes", (req, res) => {
    console.log("[ERG-SERVER] POST /estudiantes - Datos recibidos:", req.body);

    if (!req.body.nombre || req.body.nombre.trim() === "") {
        return res.status(400).json({
            error: "El nombre es obligatorio"
        });
    }

    if (!req.body.edad) {
        return res.status(400).json({
            error: "La edad es obligatoria"
        });
    }

    if (!req.body.correo || req.body.correo.trim() === "") {
        return res.status(400).json({
            error: "El correo es obligatorio"
        });
    }

    const nuevoEstudiante = {
        id: nextId++,
        nombre: req.body.nombre.trim(),
        edad: parseInt(req.body.edad, 10),
        correo: req.body.correo.trim(),
        rango: req.body.rango || "Iniciado",
        juego: req.body.juego || "General Gaming",
        avatar: req.body.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.body.nombre)}&background=random`
    };

    estudiantes.push(nuevoEstudiante);

    res.status(201).json({
        mensaje: "Estudiante registrado exitosamente",
        detalles: {
            correoRecibido: true,
            edadRecibida: true,
            estudianteRecibido: true
        },
        estudiante: nuevoEstudiante
    });
});

// 4. Actualizar estudiante por ID
app.put("/estudiantes/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = estudiantes.findIndex(e => e.id === id);

    console.log("[ERG-SERVER] PUT /estudiantes/" + id, req.body);

    if (index === -1) {
        return res.status(404).json({
            error: "Estudiante no encontrado",
            id: req.params.id
        });
    }

    // Actualizar campos permitidos
    if (req.body.nombre) estudiantes[index].nombre = req.body.nombre;
    if (req.body.edad) estudiantes[index].edad = parseInt(req.body.edad, 10);
    if (req.body.correo) estudiantes[index].correo = req.body.correo;
    if (req.body.rango) estudiantes[index].rango = req.body.rango;
    if (req.body.juego) estudiantes[index].juego = req.body.juego;

    res.json({
        mensaje: "Estudiante actualizado con éxito",
        id: id,
        nombre: estudiantes[index].nombre,
        estudiante: estudiantes[index]
    });
});

// 5. Eliminar estudiante por ID
app.delete("/estudiantes/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = estudiantes.findIndex(e => e.id === id);

    console.log("[ERG-SERVER] DELETE /estudiantes/" + id);

    if (index === -1) {
        return res.status(404).json({
            error: "Estudiante no encontrado",
            id: req.params.id
        });
    }

    const eliminado = estudiantes.splice(index, 1)[0];

    res.json({
        mensaje: "Estudiante eliminado",
        id: id,
        estudiante: eliminado
    });
});

// 6. Búsqueda con Query Parameters
app.get("/buscar", (req, res) => {
    console.log("[ERG-SERVER] GET /buscar - Query params:", req.query);

    const queryTerm = (req.query.termino || req.query.q || req.query.nombre || "").toLowerCase();

    let resultados = estudiantes;
    if (queryTerm) {
        resultados = estudiantes.filter(e =>
            e.nombre.toLowerCase().includes(queryTerm) ||
            e.correo.toLowerCase().includes(queryTerm) ||
            (e.juego && e.juego.toLowerCase().includes(queryTerm)) ||
            (e.rango && e.rango.toLowerCase().includes(queryTerm))
        );
    }

    res.json({
        mensaje: "Búsqueda realizada",
        query: req.query,
        coincidencias: resultados.length,
        resultados: resultados
    });
});

// Iniciar Servidor
app.listen(port, 'localhost', () => {
    console.log(`🎮 ========================================================`);
    console.log(`🎮 [ERG-BACKEND] Servidor corriendo en http://localhost:${port}`);
    console.log(`🎮 [ERG-BACKEND] Módulo de Estudiantes listo`);
    console.log(`🎮 ========================================================`);
});
