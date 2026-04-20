# Cómo arrancar la Semilla

Esta guía asume que **no sabés nada de programación**. Seguí los pasos tal cual.

## Lo que necesitás

- **Claude Code** instalado y funcionando (lo tenés, ya lo estás usando)
- **Este repo** en tu compu (si estás leyendo esto desde Claude Code, ya lo tenés)

## Paso 1 — Instalar las dependencias (una sola vez)

Abrí la terminal/consola en la carpeta del repo y ejecutá:

```bash
npm install
```

Esto descarga dos librerías chicas que usa el servidor. Tarda 10-30 segundos.

## Paso 2 — Arrancar la Semilla

```bash
npm start
```

Vas a ver algo así:

```
🌱 Semilla andando en http://localhost:3000
   Abrí ese enlace en tu navegador (compu o celular).
```

## Paso 3 — Abrir el tablero

En la compu: abrí **http://localhost:3000** en cualquier navegador.

En el celular (misma wifi que la compu):
1. Mirá la IP local de tu compu (en Windows: `ipconfig`, buscás "Dirección IPv4")
2. Desde el cel, abrí `http://ESA-IP:3000`

(Más adelante cuando el sistema se auto-construya te arma un túnel público para que entres desde cualquier lado.)

## Paso 4 — Instalar el tablero como app en el cel (opcional)

Entrás con Chrome en Android → menú ⋮ → **"Instalar aplicación"**. Queda con icono y pantalla completa, igual que una app nativa.

## Paso 5 — Dar la primera orden

Escribí tu primera tarea en la barra inferior **"Decile qué querés al sistema…"** y apretá Enter. Para arrancar la auto-construcción, algo como:

> **Armate a vos mismo completo.** Leé agentes/orquestador.md y actuá según ese rol. Construí el resto del sistema (capataces, bibliotecario, notificaciones, app nativa). Tenés autoridad total: decidí solo, registrá tus decisiones en el feed.

Cuando enviás la orden vas a ver en el tablero cómo pasa de **Pendiente → En curso → Hecha**. El feed de la izquierda te muestra cada paso en castellano. **No hay aprobaciones**: los agentes deciden todo. Si algo no te gusta, mandás otra orden para revertirlo.

## Si algo falla

- **"command not found: npm"** → falta Node.js. Si instalaste Claude Code probablemente lo tenés. Probá `node -v`. Si no hay Node, descargalo de nodejs.org.
- **"command not found: claude"** → el obrero no encuentra Claude Code. Asegurate que abrís la terminal desde donde funciona `claude --version`.
- **Otro error** → copiá el mensaje acá y te ayudo.

## Detener el sistema

En la terminal donde corre, apretá `Ctrl + C`. El estado queda guardado en `semilla/datos/estado.json`, así que cuando volvés a arrancar sigue donde quedó.
