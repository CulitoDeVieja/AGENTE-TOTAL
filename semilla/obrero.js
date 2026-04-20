// ============================================================
// OBRERO — el que ejecuta una tarea
// ============================================================
// El jefe le pasa una tarea y el obrero la resuelve hablando
// con Claude Code (tu Plan Max). Se comunica por "subprocess":
// arranca el comando `claude -p "tu prompt"` y espera la
// respuesta.
//
// Esto es la versión mínima: un solo obrero, un prompt directo.
// Más adelante el sistema se construye capataces y varios
// obreros en paralelo.
// ============================================================

import { spawn } from 'child_process';

const BINARIO_CLAUDE = process.env.CLAUDE_BIN || 'claude';

export async function ejecutarObrero(tarea, { raizProyecto, onProgreso } = {}) {
  onProgreso?.(`Arranqué con: "${tarea.titulo}"`);

  const prompt = armarPrompt(tarea);
  const args = ['-p', prompt];

  return new Promise((resolve, reject) => {
    let salida = '';
    let error = '';

    const proceso = spawn(BINARIO_CLAUDE, args, {
      cwd: raizProyecto,
      shell: process.platform === 'win32',
    });

    proceso.stdout.on('data', (chunk) => {
      const texto = chunk.toString();
      salida += texto;
      const primeraLinea = texto.split('\n')[0].trim();
      if (primeraLinea) onProgreso?.(recortar(primeraLinea, 140));
    });

    proceso.stderr.on('data', (chunk) => {
      error += chunk.toString();
    });

    proceso.on('error', (err) => {
      reject(
        new Error(
          `No pude arrancar Claude Code. ¿Está instalado y accesible como "${BINARIO_CLAUDE}"? Detalle: ${err.message}`
        )
      );
    });

    proceso.on('close', (codigo) => {
      if (codigo === 0) {
        resolve({ salida, error, codigo });
      } else {
        reject(
          new Error(
            `Claude Code terminó con error (código ${codigo}). ${recortar(
              error || salida,
              300
            )}`
          )
        );
      }
    });
  });
}

function armarPrompt(tarea) {
  return [
    'Sos un obrero del sistema AGENTE-TOTAL. Tu trabajo es ejecutar la tarea',
    'que te asignaron. Trabajá dentro del repo actual. Hablá siempre en castellano.',
    '',
    `Tarea: ${tarea.titulo}`,
    tarea.descripcion ? `\nDetalle:\n${tarea.descripcion}` : '',
    '',
    'Cuando termines, dejá un resumen corto (3-5 líneas) de qué hiciste,',
    'qué archivos cambiaste y si quedó algo pendiente. No uses jerga técnica',
    'innecesaria: el dueño no es programador.',
  ]
    .filter(Boolean)
    .join('\n');
}

function recortar(texto, limite) {
  if (!texto) return '';
  const t = texto.trim().replace(/\s+/g, ' ');
  return t.length > limite ? t.slice(0, limite - 1) + '…' : t;
}
