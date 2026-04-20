// Pruebas mínimas de persistencia. Usan un directorio temporal para no pisar datos reales.
import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import * as persistencia from '../persistencia.js';

test('leer devuelve porDefecto cuando el archivo no existe', async () => {
  // Nombre aleatorio para evitar colisiones.
  const nombre = `_prueba_inexistente_${Date.now()}`;
  const resultado = await persistencia.leer(nombre, { vacio: true });
  assert.deepEqual(resultado, { vacio: true });
});

test('escribir + leer round-trip', async () => {
  const nombre = `_prueba_rt_${Date.now()}`;
  const datos = [{ a: 1 }, { b: 2 }];
  await persistencia.escribir(nombre, datos);
  try {
    const leidos = await persistencia.leer(nombre);
    assert.deepEqual(leidos, datos);
  } finally {
    await fs.rm(path.join(persistencia.raizDatos, `${nombre}.json`), { force: true });
  }
});

test('mutar aplica transformación y serializa', async () => {
  const nombre = `_prueba_mutar_${Date.now()}`;
  try {
    await persistencia.escribir(nombre, [1, 2]);
    await persistencia.mutar(nombre, (actual) => [...actual, 3]);
    await persistencia.mutar(nombre, (actual) => [...actual, 4]);
    const final = await persistencia.leer(nombre);
    assert.deepEqual(final, [1, 2, 3, 4]);
  } finally {
    await fs.rm(path.join(persistencia.raizDatos, `${nombre}.json`), { force: true });
  }
});

test('mutaciones concurrentes no se pisan', async () => {
  const nombre = `_prueba_concurrente_${Date.now()}`;
  try {
    await persistencia.escribir(nombre, []);
    const tareas = Array.from({ length: 20 }, (_, i) =>
      persistencia.mutar(nombre, (actual) => [...actual, i]),
    );
    await Promise.all(tareas);
    const final = await persistencia.leer(nombre);
    assert.equal(final.length, 20);
    assert.deepEqual([...final].sort((a, b) => a - b), Array.from({ length: 20 }, (_, i) => i));
  } finally {
    await fs.rm(path.join(persistencia.raizDatos, `${nombre}.json`), { force: true });
  }
});
