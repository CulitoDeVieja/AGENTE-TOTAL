// Persistencia JSON con escritura atómica y cola por archivo.
// Fuente de verdad: archivos en datos/*.json.
// Cada archivo se lee/escribe a demanda; las escrituras usan rename atómico
// y se serializan por path para evitar condiciones de carrera.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
export const raizDatos = path.resolve(aqui, '..', 'datos');

const colas = new Map();

function encolar(clave, tarea) {
  const anterior = colas.get(clave) || Promise.resolve();
  const siguiente = anterior.then(tarea, tarea);
  colas.set(clave, siguiente.finally(() => {
    if (colas.get(clave) === siguiente) colas.delete(clave);
  }));
  return siguiente;
}

function rutaDe(nombre) {
  return path.join(raizDatos, `${nombre}.json`);
}

export async function leer(nombre, porDefecto = []) {
  const ruta = rutaDe(nombre);
  try {
    const crudo = await fs.readFile(ruta, 'utf8');
    return JSON.parse(crudo);
  } catch (err) {
    if (err.code === 'ENOENT') return porDefecto;
    throw new Error(`[persistencia] no pude leer ${nombre}: ${err.message}`);
  }
}

export async function escribir(nombre, datos) {
  const ruta = rutaDe(nombre);
  return encolar(ruta, async () => {
    await fs.mkdir(path.dirname(ruta), { recursive: true });
    const temporal = `${ruta}.${process.pid}.${Date.now()}.tmp`;
    const cuerpo = JSON.stringify(datos, null, 2);
    await fs.writeFile(temporal, cuerpo, 'utf8');
    await fs.rename(temporal, ruta);
    return datos;
  });
}

// Mutación segura: lee, transforma, escribe — todo dentro de la misma cola.
export async function mutar(nombre, transformar, porDefecto = []) {
  const ruta = rutaDe(nombre);
  return encolar(ruta, async () => {
    let actual;
    try {
      const crudo = await fs.readFile(ruta, 'utf8');
      actual = JSON.parse(crudo);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      actual = porDefecto;
    }
    const siguiente = await transformar(actual);
    await fs.mkdir(path.dirname(ruta), { recursive: true });
    const temporal = `${ruta}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(temporal, JSON.stringify(siguiente, null, 2), 'utf8');
    await fs.rename(temporal, ruta);
    return siguiente;
  });
}

export async function existe(nombre) {
  try {
    await fs.access(rutaDe(nombre));
    return true;
  } catch {
    return false;
  }
}
