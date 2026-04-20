// ============================================================
// Cliente del tablero — se conecta al servidor por WebSocket
// y refleja el estado en tiempo real.
// ============================================================

const elFeed = document.getElementById('feed');
const elTablero = document.getElementById('tablero');
const elEstadoConexion = document.getElementById('estado-conexion');
const btnNueva = document.getElementById('boton-nueva');
const dialogo = document.getElementById('dialogo-nueva');
const formNueva = document.getElementById('form-nueva');

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
    const tareas = estado.tareas.filter((t) => t.estado === estadoCol);
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
  meta.textContent = `#${t.id} · ${t.agente || 'jefe'} · ${formatearHora(t.actualizada)}`;

  li.append(titulo, meta);

  if (t.estado === 'revision') {
    const acc = document.createElement('div');
    acc.className = 'acciones-tarjeta';
    const ok = document.createElement('button');
    ok.className = 'aprobar';
    ok.textContent = 'Aprobar';
    ok.onclick = () => aprobar(t.id);
    const no = document.createElement('button');
    no.className = 'rechazar';
    no.textContent = 'Rechazar';
    no.onclick = () => rechazar(t.id);
    acc.append(ok, no);
    li.append(acc);
  }
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

// ---------- Acciones ----------

async function aprobar(id) {
  await fetch(`/api/tareas/${id}/aprobar`, { method: 'POST' });
}

async function rechazar(id) {
  const motivo = prompt('¿Por qué lo rechazás? (podés dejarlo vacío)') || '';
  await fetch(`/api/tareas/${id}/rechazar`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ motivo }),
  });
}

btnNueva.onclick = () => dialogo.showModal();

formNueva.addEventListener('submit', async (ev) => {
  const accion = ev.submitter?.value;
  if (accion !== 'crear') return;
  ev.preventDefault();
  const datos = Object.fromEntries(new FormData(formNueva).entries());
  if (!datos.titulo) return;
  await fetch('/api/tareas', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(datos),
  });
  formNueva.reset();
  dialogo.close();
});
