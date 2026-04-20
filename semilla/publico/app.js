// ============================================================
// Cliente del tablero — solo lectura excepto el input
// para darle órdenes nuevas al sistema.
// ============================================================

const elFeed = document.getElementById('feed');
const elTablero = document.getElementById('tablero');
const elEstadoConexion = document.getElementById('estado-conexion');
const formOrden = document.getElementById('form-orden');
const inputOrden = document.getElementById('input-orden');

let estado = { tareas: [], feed: [] };

// ---------- WebSocket ----------

function conectar() {
  const protocolo = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${protocolo}://${location.host}`);

  ws.onopen = () => {
    elEstadoConexion.textContent = 'conectado';
    elEstadoConexion.style.color = 'var(--verde)';
  };

  ws.onclose = () => {
    elEstadoConexion.textContent = 'reconectando…';
    elEstadoConexion.style.color = 'var(--amarillo)';
    setTimeout(conectar, 1500);
  };

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.tipo === 'estado-completo') {
      estado = msg.estado;
      dibujarTodo();
    } else if (msg.tipo === 'feed') {
      estado.feed.unshift(msg.entrada);
      dibujarFeed();
    } else if (msg.tipo === 'tarea') {
      const idx = estado.tareas.findIndex((t) => t.id === msg.tarea.id);
      if (idx >= 0) estado.tareas[idx] = msg.tarea;
      else estado.tareas.push(msg.tarea);
      dibujarTablero();
    }
  };
}

conectar();

// ---------- Dibujar ----------

function dibujarTodo() {
  dibujarFeed();
  dibujarTablero();
}

function dibujarFeed() {
  elFeed.innerHTML = '';
  const corto = estado.feed.slice(0, 80);
  for (const ev of corto) {
    const li = document.createElement('li');
    const cuando = document.createElement('span');
    cuando.className = 'cuando';
    cuando.textContent = formatearHora(ev.cuando);
    const texto = document.createElement('span');
    texto.textContent = ev.mensaje || JSON.stringify(ev);
    li.append(cuando, texto);
    elFeed.append(li);
  }
}

function dibujarTablero() {
  const pilas = elTablero.querySelectorAll('.pila');
  for (const pila of pilas) {
    const ul = pila.querySelector('ul');
    ul.innerHTML = '';
    const estadoCol = pila.dataset.estado;
    const tareas = estado.tareas
      .filter((t) => t.estado === estadoCol && !t.archivada)
      .slice(-30);
    for (const t of tareas) ul.append(tarjeta(t));
  }
}

function tarjeta(t) {
  const li = document.createElement('li');
  li.className = 'tarjeta';

  const titulo = document.createElement('div');
  titulo.className = 'titulo-tarea';
  titulo.textContent = t.titulo;

  const meta = document.createElement('div');
  meta.className = 'meta';
  const intentos = t.intentos ? ` · intentos: ${t.intentos}` : '';
  meta.textContent = `#${t.id} · ${t.agente || 'jefe'}${intentos} · ${formatearHora(t.actualizada)}`;

  li.append(titulo, meta);
  return li;
}

function formatearHora(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------- Input de órdenes ----------

formOrden.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const titulo = inputOrden.value.trim();
  if (!titulo) return;
  inputOrden.disabled = true;
  try {
    await fetch('/api/tareas', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ titulo }),
    });
    inputOrden.value = '';
  } finally {
    inputOrden.disabled = false;
    inputOrden.focus();
  }
});
