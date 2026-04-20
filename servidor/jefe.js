// Loop del jefe. Versión stub: cada N segundos revisa tareas pendientes
// y deja una nota en el feed. La integración real con Claude Code
// llega en la próxima tanda; por ahora sólo late para que el tablero
// lo vea vivo.

import { leer, mutar } from './persistencia.js';

const INTERVALO_MS = Number(process.env.JEFE_INTERVALO_MS || 30_000);

export function arrancarJefe({ hub }) {
  let vivo = true;
  let ticks = 0;

  async function tick() {
    if (!vivo) return;
    ticks += 1;
    try {
      const tareas = await leer('tareas', []);
      const pendientes = tareas.filter((t) => t.estado === 'pendiente');
      const enMarcha = tareas.filter((t) => t.estado === 'en-marcha');
      const entrada = {
        id: `j_${Date.now().toString(36)}`,
        texto: `latido #${ticks}: ${pendientes.length} pendientes, ${enMarcha.length} en marcha`,
        autor: 'jefe',
        nivel: 'debug',
        momento: Date.now(),
      };
      await mutar('feed', (actual) => [entrada, ...actual].slice(0, 500));
      hub.difundir('jefe:latido', { ticks, pendientes: pendientes.length, enMarcha: enMarcha.length });
    } catch (err) {
      console.error('[jefe] tick falló:', err.message);
    }
  }

  const id = setInterval(tick, INTERVALO_MS);
  // Un primer tick tras un pequeño respiro para que el servidor quede listo.
  setTimeout(tick, 2000);

  return {
    detener() {
      vivo = false;
      clearInterval(id);
    },
  };
}
