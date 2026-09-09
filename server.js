const express = require("express");
const app = express();

app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.static(__dirname));

const port = 3000;

app.get("/", (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Backend ERG</title>
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
                    <p>Backend corriendo en el puerto <strong>${port}</strong>.</p>
                    <a href="/index.html" class="btn">Ir al Dashboard Principal</a>
                </div>
            </body>
        </html>
    `);
});

app.listen(port, "localhost", () => {
    console.log("🎮 ========================================================");
    console.log(`🎮 [ERG-BACKEND] Servidor corriendo en http://localhost:${port}`);
    console.log("🎮 ========================================================");
});
