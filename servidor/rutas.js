// Rutas REST. Respuestas siempre JSON, errores en castellano.
// Contratos:
//  GET  /api/salud        -> { ok: true, version }
//  GET  /api/feed         -> Entrada[]
//  POST /api/feed         -> { texto, autor?, nivel? } -> Entrada
//  GET  /api/tareas       -> Tarea[]
//  POST /api/tareas       -> { titulo, descripcion?, capataz?, ... } -> Tarea
//  PATCH /api/tareas/:id  -> campos parciales -> Tarea
//  GET  /api/agentes      -> Agente[]

import express from 'express';
import { leer, mutar } from './persistencia.js';

const VERSION = '0.1.0';

export function crearRutas({ hub }) {
  const api = express.Router();
  api.use(express.json({ limit: '1mb' }));

  api.get('/salud', (_req, res) => {
    res.json({ ok: true, version: VERSION, momento: Date.now() });
  });

  // ---- Feed ----
  api.get('/feed', async (_req, res, next) => {
    try {
      const feed = await leer('feed', []);
      res.json(feed);
    } catch (err) { next(err); }
  });

  api.post('/feed', async (req, res, next) => {
    try {
      const { texto, autor = 'sistema', nivel = 'info' } = req.body || {};
      if (typeof texto !== 'string' || !texto.trim()) {
        return res.status(400).json({ error: 'texto requerido' });
      }
      const entrada = {
        id: nuevoId('f'),
        texto: texto.trim(),
        autor,
        nivel,
        momento: Date.now(),
      };
      await mutar('feed', (actual) => [entrada, ...actual].slice(0, 500));
      hub.difundir('feed:nueva', entrada);
      res.status(201).json(entrada);
    } catch (err) { next(err); }
  });

  // ---- Tareas ----
  api.get('/tareas', async (_req, res, next) => {
    try {
      const tareas = await leer('tareas', []);
      res.json(tareas);
    } catch (err) { next(err); }
  });

  api.post('/tareas', async (req, res, next) => {
    try {
      const b = req.body || {};
      if (typeof b.titulo !== 'string' || !b.titulo.trim()) {
        return res.status(400).json({ error: 'titulo requerido' });
      }
      const tarea = {
        id: nuevoId('t'),
        titulo: b.titulo.trim(),
        descripcion: (b.descripcion || '').toString(),
        capataz: b.capataz || 'sin-asignar',
        estado: 'pendiente',
        dependencias: Array.isArray(b.dependencias) ? b.dependencias : [],
        creadaEn: Date.now(),
        actualizadaEn: Date.now(),
        registro: [],
      };
      await mutar('tareas', (actual) => [tarea, ...actual]);
      hub.difundir('tarea:creada', tarea);
      res.status(201).json(tarea);
    } catch (err) { next(err); }
  });

  api.patch('/tareas/:id', async (req, res, next) => {
    try {
      const id = req.params.id;
      const cambios = req.body || {};
      let actualizada = null;
      await mutar('tareas', (actual) => {
        const idx = actual.findIndex((t) => t.id === id);
        if (idx === -1) return actual;
        const anterior = actual[idx];
        const siguiente = {
          ...anterior,
          ...filtrarCampos(cambios, ['titulo', 'descripcion', 'capataz', 'estado', 'dependencias']),
          actualizadaEn: Date.now(),
        };
        if (cambios.entradaRegistro) {
          siguiente.registro = [
            ...anterior.registro,
            { momento: Date.now(), texto: String(cambios.entradaRegistro) },
          ];
        }
        actualizada = siguiente;
        const copia = actual.slice();
        copia[idx] = siguiente;
        return copia;
      });
      if (!actualizada) return res.status(404).json({ error: 'tarea no encontrada' });
      hub.difundir('tarea:actualizada', actualizada);
      res.json(actualizada);
    } catch (err) { next(err); }
  });

  // ---- Agentes ----
  api.get('/agentes', async (_req, res, next) => {
    try {
      const agentes = await leer('agentes', []);
      res.json(agentes);
    } catch (err) { next(err); }
  });

  // Manejador de errores — siempre JSON, castellano.
  api.use((err, _req, res, _next) => {
    console.error('[api] error:', err.message);
    res.status(500).json({ error: 'error interno', detalle: err.message });
  });

  return api;
}

function filtrarCampos(obj, permitidos) {
  const salida = {};
  for (const k of permitidos) if (k in obj) salida[k] = obj[k];
  return salida;
}

function nuevoId(prefijo) {
  return `${prefijo}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
