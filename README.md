# AGENTE-TOTAL

Sistema que construye apps usando equipos de agentes de IA coordinados.

## Idea en una frase

Vos le pedís una app, el sistema tiene un **jefe de obra** que reparte el trabajo entre **capataces** especializados, y cada capataz dirige a **obreros** que escriben el código.

## Jerarquía

```
Vos (dueño)
  │
  └─ Jefe de obra         ← recibe tu pedido, arma el plan
       │
       ├─ Capataz frontend
       │    ├─ Obrero 1
       │    ├─ Obrero 2
       │    └─ Obrero 3
       ├─ Capataz backend
       │    └─ ...
       └─ (más capataces por especialidad)
```

Además:
- **Bibliotecario** — cuida el Manual de Recetas y te manda un resumen diario con mejoras
- **Revisores** — leen el trabajo de los obreros y marcan errores

## Fases del proyecto

| Fase | Qué pasa |
|---|---|
| **0 — Semilla** | La versión mínima funcionando. La escribe Claude Code a mano (una sola vez) |
| **1 — Auto-construcción** | La semilla se construye a sí misma completa: más agentes, manual, app Android, app Windows |
| **2 — Primera app externa** | Le pedís tu primera app de verdad y el sistema la construye |

## Qué hay en este repo

```
/
├─ semilla/            → La Fase 0. Lo mínimo para que arranque todo
│   ├─ servidor.js     → Servidor web + jefe de obra
│   ├─ obrero.js       → Ejecutor de tareas (usa Claude Code)
│   ├─ datos/          → Estado del sistema (tareas, feed)
│   └─ publico/        → Tablero web (kanban + feed)
├─ manual/             → Recetas compartidas y por capataz
└─ INICIO.md           → Cómo arrancar el sistema (instrucciones simples)
```

## Cómo empezar

Ver [INICIO.md](./INICIO.md).

## Principios

- **Todo en castellano** (código, mensajes, documentación)
- **Explicaciones simples** — el sistema nunca te habla en jerga técnica
- **Panel solo informativo** — los agentes resuelven todo de forma autónoma. El dueño mira el progreso y, si algo no le gusta, lo revierte con una nueva orden (ver [agentes/autoridad.md](./agentes/autoridad.md))
- **El sistema mejora solo** — cada día mira qué aprendió y actualiza sus recetas
