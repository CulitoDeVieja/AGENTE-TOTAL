// Hub de WebSocket: difunde eventos a todos los tableros conectados.
// Cada mensaje es { tipo, carga, momento }.
// El tablero es sólo lector; no acepta comandos por ahora.

import { WebSocketServer } from 'ws';

export function crearHub(servidorHttp) {
  const wss = new WebSocketServer({ server: servidorHttp, path: '/ws' });

  wss.on('connection', (ws) => {
    log('tablero conectado');
    ws.send(JSON.stringify({ tipo: 'hola', carga: { version: 1 }, momento: Date.now() }));
    ws.on('close', () => log('tablero desconectado'));
    ws.on('error', (err) => log(`error ws: ${err.message}`));
  });

  function difundir(tipo, carga) {
    const paquete = JSON.stringify({ tipo, carga, momento: Date.now() });
    for (const cliente of wss.clients) {
      if (cliente.readyState === 1) cliente.send(paquete);
    }
  }

  return { difundir, wss };
}

function log(msg) {
  console.log(`[hub] ${msg}`);
}
