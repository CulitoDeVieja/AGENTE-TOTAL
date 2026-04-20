# Agentes del sistema

Esta carpeta tiene los **prompts de sistema** de cada rol. Son los "manuales de puesto" que cada agente recibe cuando lo invocan.

| Rol | Archivo | Cuándo se invoca |
|---|---|---|
| Orquestador (Jefe) | `orquestador.md` | Cada 1 min, disparado por la app del dueño o por un cron |
| Capataz Backend | `capataz-backend.md` | Cuando el Orquestador le asigna una tarea |
| Capataz Frontend | `capataz-frontend.md` | Cuando el Orquestador le asigna una tarea |

## Sincronización — cómo no se pisan

La regla es una sola: **`semilla/datos/estado.json` es la fuente de verdad**.

1. Cada agente, antes de hacer cualquier cosa, **lee** `estado.json` y las últimas 20 entradas del feed.
2. Cuando escribe, lo hace de manera **atómica**: carga el archivo entero, modifica en memoria, escribe todo de vuelta.
3. El **feed** actúa como registro cronológico: cada agente deja una línea corta de qué hizo.
4. Las **dependencias** entre tareas se anotan en la descripción (`Depende de #12`) — el Orquestador las respeta.

Si dos capataces quieren tocar el mismo archivo, gana el que llega primero y el segundo espera en estado `pendiente`. Por ahora hay poca concurrencia (1 obrero por vez en la Fase 0); cuando el sistema crezca, el Orquestador decide el orden.

## Pegar el prompt en tu app nativa

Abrí `orquestador.md`, copiá todo el contenido desde la línea `Sos el **JEFE DE OBRA**...` hasta el final, y pegálo como prompt inicial de la sesión que tu app dispara cada minuto.
