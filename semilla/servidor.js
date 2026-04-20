// ============================================================
// SERVIDOR — la columna vertebral de la Semilla
// ============================================================
// Hace 3 cosas:
//   1. Sirve el tablero web (solo lectura) en el navegador
//   2. Expone una API: leer estado + crear nuevas órdenes
//   3. Corre el "jefe de obra" en loop: busca tareas y las
//      manda a los obreros para que las ejecuten
//
// El panel es 100% informativo. Los agentes deciden todo solos
// según su autoridad (ver agentes/autoridad.md). No hay
// aprobaciones humanas mid-flight.
// ============================================================

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ejecutarObrero } from './obrero.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(__dirname, '..');
const ARCHIVO_ESTADO = join(__dirname, 'datos', 'estado.json');
const CARPETA_PUBLICO = join(__dirname, 'publico');
const PUERTO = process.env.PUERTO || 3000;

// ---------- Estado en memoria + persistencia en JSON ----------

let estado = {
  tareas: [],
  feed: [],
  proximoId: 1,
};

async function cargarEstado() {
  if (!existsSync(ARCHIVO_ESTADO)) {
    await mkdir(dirname(ARCHIVO_ESTADO), { recursive: true });
    await guardarEstado();
    return;
  }
  const crudo = await readFile(ARCHIVO_ESTADO, 'utf-8');
  estado = JSON.parse(crudo);
}

async function guardarEstado() {
  await writeFile(ARCHIVO_ESTADO, JSON.stringify(estado, null, 2));
}

// ---------- Helpers de feed y tareas ----------

function agregarAlFeed(evento) {
  const entrada = {
    id: estado.proximoId++,
    cuando: new Date().toISOString(),
    ...evento,
  };
  estado.feed.unshift(entrada);
  if (estado.feed.length > 500) estado.feed.length = 500;
  transmitir({ tipo: 'feed', entrada });
  return entrada;
}

function crearTarea(datos) {
  const tarea = {
    id: estado.proximoId++,
    titulo: datos.titulo,
    descripcion: datos.descripcion || '',
    estado: 'pendiente',
    agente: datos.agente || 'jefe',
    creada: new Date().toISOString(),
    actualizada: new Date().toISOString(),
    registro: [],
  };
  estado.tareas.push(tarea);
  agregarAlFeed({
    tipo: 'tarea-creada',
    mensaje: `Nueva tarea: "${tarea.titulo}"`,
    tareaId: tarea.id,
  });
  return tarea;
}

function actualizarTarea(id, cambios, nota) {
  const tarea = estado.tareas.find((t) => t.id === id);
  if (!tarea) return null;
  Object.assign(tarea, cambios, { actualizada: new Date().toISOString() });
  if (nota) {
    tarea.registro.push({ cuando: new Date().toISOString(), nota });
  }
  transmitir({ tipo: 'tarea', tarea });
  return tarea;
}

// ---------- WebSocket para updates en vivo ----------

const clientes = new Set();
function transmitir(mensaje) {
  const texto = JSON.stringify(mensaje);
  for (const c of clientes) {
    if (c.readyState === 1) c.send(texto);
  }
}

// ---------- API HTTP ----------

const app = express();
app.use(express.json());
app.use(express.static(CARPETA_PUBLICO));

app.get('/api/estado', (_req, res) => {
  res.json(estado);
});

app.post('/api/tareas', async (req, res) => {
  const tarea = crearTarea(req.body || {});
  await guardarEstado();
  res.json(tarea);
});

// ---------- Loop del jefe de obra ----------
//
// Cada cierto tiempo mira si hay tareas pendientes y las manda
// a un obrero. En la Semilla solo corre 1 obrero a la vez. Más
// adelante el sistema se va a agregar capataces y múltiples obreros.

let obreroOcupado = false;

async function loopJefe() {
  try {
    if (!obreroOcupado) {
      const pendiente = estado.tareas.find((t) => t.estado === 'pendiente');
      if (pendiente) {
        obreroOcupado = true;
        actualizarTarea(pendiente.id, { estado: 'en-curso' }, 'Obrero asignado');
        agregarAlFeed({
          tipo: 'arranque',
          mensaje: `Arranqué a trabajar en "${pendiente.titulo}"`,
          tareaId: pendiente.id,
        });
        await guardarEstado();

        try {
          const resultado = await ejecutarObrero(pendiente, {
            raizProyecto: RAIZ,
            onProgreso: (mensaje) => {
              agregarAlFeed({
                tipo: 'progreso',
                mensaje,
                tareaId: pendiente.id,
              });
            },
          });
          actualizarTarea(
            pendiente.id,
            { estado: 'hecha', resultado },
            'Obrero terminó'
          );
          agregarAlFeed({
            tipo: 'terminado',
            mensaje: `Terminé "${pendiente.titulo}".`,
            tareaId: pendiente.id,
          });
        } catch (err) {
          const intentosPrevios = pendiente.intentos || 0;
          actualizarTarea(
            pendiente.id,
            { estado: 'fallada', intentos: intentosPrevios + 1 },
            `Falló: ${err.message}`
          );
          agregarAlFeed({
            tipo: 'error',
            mensaje: `Tuve un problema con "${pendiente.titulo}": ${err.message}`,
            tareaId: pendiente.id,
          });
        }
        obreroOcupado = false;
        await guardarEstado();
      }
    }
  } catch (err) {
    console.error('Error en loop del jefe:', err);
    obreroOcupado = false;
  }
  setTimeout(loopJefe, 2000);
}

// ---------- Arranque ----------

async function arrancar() {
  await cargarEstado();

  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    clientes.add(ws);
    ws.send(JSON.stringify({ tipo: 'estado-completo', estado }));
    ws.on('close', () => clientes.delete(ws));
  });

  server.listen(PUERTO, () => {
    console.log(`\n🌱 Semilla andando en http://localhost:${PUERTO}`);
    console.log(`   Abrí ese enlace en tu navegador (compu o celular).\n`);
  });

  loopJefe();
}

arrancar().catch((e) => {
  console.error('No pude arrancar:', e);
  process.exit(1);
});
