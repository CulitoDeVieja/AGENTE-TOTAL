// Entrada del servidor AGENTE-TOTAL.
// Express para HTTP/REST, ws para tiempo real, persistencia JSON en disco.
// El panel estático se sirve desde semilla/publico si existe.

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import express from 'express';

import { crearHub } from './hub.js';
import { crearRutas } from './rutas.js';
import { arrancarJefe } from './jefe.js';
import { leer, escribir, existe } from './persistencia.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '..');
const puerto = Number(process.env.PORT || 3737);
const publico = path.join(raiz, 'semilla', 'publico');

async function sembrar() {
  // Crea archivos JSON iniciales si faltan — sin pisar datos existentes.
  if (!(await existe('feed'))) await escribir('feed', []);
  if (!(await existe('tareas'))) await escribir('tareas', []);
  if (!(await existe('agentes'))) {
    await escribir('agentes', [
      {
        id: 'capataz-backend',
        rol: 'capataz',
        especialidad: 'backend',
        estado: 'activo',
        desde: Date.now(),
      },
    ]);
  }
}

async function arrancar() {
  await sembrar();

  const app = express();
  app.disable('x-powered-by');

  // Logs cortos de acceso.
  app.use((req, _res, next) => {
    console.log(`[http] ${req.method} ${req.url}`);
    next();
  });

  const servidor = http.createServer(app);
  const hub = crearHub(servidor);

  app.use('/api', crearRutas({ hub }));

  // Panel estático (si el capataz-frontend ya lo puso).
  try {
    await fs.access(publico);
    app.use(express.static(publico));
    app.get('/', (_req, res) => res.sendFile(path.join(publico, 'index.html')));
  } catch {
    app.get('/', (_req, res) => {
      res.type('text/plain').send(
        'AGENTE-TOTAL backend vivo. El panel todavía no fue sembrado. Probá /api/salud.',
      );
    });
  }

  const jefe = arrancarJefe({ hub });

  servidor.listen(puerto, () => {
    console.log(`[servidor] escuchando en http://localhost:${puerto}`);
  });

  const apagar = async (senal) => {
    console.log(`[servidor] recibí ${senal}, apagando`);
    jefe.detener();
    hub.wss.close();
    servidor.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGINT', () => apagar('SIGINT'));
  process.on('SIGTERM', () => apagar('SIGTERM'));
}

arrancar().catch((err) => {
  console.error('[servidor] no arrancó:', err);
  process.exit(1);
});
