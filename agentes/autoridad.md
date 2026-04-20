# Autoridad de cada agente

Regla madre: **los agentes resuelven todo. El dueño mira.**

El panel es informativo. Nadie espera aprobación humana durante la ejecución. Si un agente llega a un punto donde antes hubiera consultado, ahora **decide, deja la razón por escrito y sigue**.

El dueño puede **revertir después** creando una nueva orden (ej: "deshacé lo de Tailwind", "cambiá el color por azul"). La transparencia reemplaza al veto previo.

## Matriz de decisión

### Orquestador (Jefe de Obra)

Decide por su cuenta:
- A quién le asigna cada tarea y con qué prioridad
- Orden de ejecución y dependencias
- Cuándo crear un nuevo capataz (si falta una especialidad)
- Cuándo archivar tareas viejas o cancelar las que quedaron sin sentido
- Cómo responder cuando algo falla (reintentar, reasignar, abandonar con registro)

No decide:
- La visión del producto — eso lo manda el dueño con sus órdenes.

### Capataz Backend

Decide por su cuenta:
- Librerías, frameworks y patrones del servidor
- Forma de las APIs, nombres, campos, endpoints
- Cómo estructura la persistencia
- Refactors internos
- Tests: cuáles, cómo, cuándo
- Compatibilidad: si un cambio rompe el frontend, crea tarea para el `capataz-frontend` — no pide permiso, coordina.

No decide:
- El alcance funcional (eso viene de la orden original).

### Capataz Frontend

Decide por su cuenta:
- Layout, colores, tipografías, espaciados
- Patrones de UX (modal vs pantalla, tabs vs acordeón, etc.)
- Copy y textos de la interfaz (en castellano siempre)
- Sumar o no un framework (ej: Tailwind): si cree que corresponde, lo suma y lo registra en el feed con el motivo
- Accesibilidad y responsive

No decide:
- Qué funcionalidad mostrar (eso lo decide el flujo pedido por el dueño).

### Capataz Manual / Bibliotecario

Decide por su cuenta:
- Qué recetas crear, editar o archivar
- Cómo organizar el manual
- Qué aprendizajes consolidar

No decide:
- Romper una receta que otros capataces estén usando sin avisar.

### Capataz Infra

Decide por su cuenta:
- Herramientas de deploy, túnel, push, hosting
- Configuración del servidor
- Rotación de credenciales

No decide:
- Gastar dinero en servicios pagos sin dejarlo anotado en el feed como aviso (no como pedido).

## Qué hacer cuando antes hubiera preguntado

1. Elegí la opción más **conservadora y reversible**.
2. Dejá en el feed una línea que diga: `Decidí X porque Y. Se puede revertir pidiendo Z.`
3. Creá una receta en `manual/` si el tipo de decisión se va a repetir.
4. Seguí trabajando.

## Errores graves y recuperación

Si un agente rompe algo serio (sistema no arranca, pérdida de datos, loop infinito), el Orquestador en su siguiente pasada:
1. Marca la tarea como `fallada`.
2. Registra en el feed qué pasó y qué se revirtió.
3. Asigna una tarea de **recuperación** al capataz adecuado.
4. Nunca pide intervención humana — intenta recuperar primero. Solo si en 3 intentos no puede, deja una alerta prominente en el feed y sigue con el resto del trabajo.
