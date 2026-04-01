# Telemetry reconciliation: bugs ante cambios de slug

**Detectado:** 2026-03-27
**Estado:** Sin resolver — pendiente de implementar fix
**Archivos clave:** `src/managers/telemetry.ts`
**Funciones afectadas:** `reconcileTelemetry` (línea 214), `normalizeTelemetrySchema` (línea 587)

---

## Contexto

El sistema de reconciliación de telemetría compara el blob del servidor (Rigobot) con el blob local (localStorage o CLI) y elige el más reciente (`last_interaction_at`). Después de elegir el ganador, `normalizeTelemetrySchema` fusiona los datos de actividad del blob almacenado con la estructura de ejercicios actual (`freshSteps`).

El mecanismo de fusión de steps dentro de `normalizeTelemetrySchema` está **basado exclusivamente en slug**:

```typescript
// telemetry.ts:622
const storedBySlug = new Map(picked.steps.map((s) => [s.slug, s]));
return freshSteps.map((fresh) => {
  const stored = storedBySlug.get(fresh.slug); // lookup por slug exacto
  if (!stored) return fresh;                    // sin match → step vacío (datos perdidos)
  return { ...fresh, ...activityDataFromStored };
});
```

Y la validación de si el blob completo es usable también es slug-based:

```typescript
// telemetry.ts:222
const hasServer = serverTelemetry && serverTelemetry.slug === tutorialSlug;
const hasLocal  = localTelemetry  && localTelemetry.slug  === tutorialSlug;
```

---

## Bug 1: cambio de slug del paquete/tutorial

### Descripción

Si el slug del paquete (ej. el campo `slug` en `learn.json`) cambia de `"intro-to-python"` a `"python-basics"`:

- `hasServer` evalúa a `false`: el blob del servidor tiene `slug: "intro-to-python"` ≠ `"python-basics"`
- `hasLocal` evalúa a `false`: ídem en localStorage
- Ninguno de los dos blobs supera la validación → se crea un **blob vacío nuevo**

### Consecuencia

**Pérdida total e irrecuperable del historial del usuario**: compilaciones, tests, AI interactions, completions, quiz submissions — todo queda descartado.

El usuario que había completado parte del tutorial aparece como si nunca hubiera empezado.

### Severidad

Alta. El tutorial continúa funcionando, pero el progreso del usuario desaparece. Si Rigobot ya tenía el blob con el slug viejo en BigQuery, esos datos siguen existiendo en el servidor pero el cliente nunca los vuelve a leer porque el slug no coincide.

### Reproducción

1. Usuario trabaja el tutorial con slug `"A"` y completa varios ejercicios.
2. El autor cambia el slug del tutorial a `"B"` (en `learn.json`).
3. El usuario vuelve a abrir el tutorial.
4. `reconcileTelemetry` descarta ambos blobs y crea uno nuevo vacío.

---

## Bug 2: cambio de slug de un ejercicio individual

### Descripción

Si un ejercicio cambia su slug (ej. su carpeta se renombra de `"01-hello-world"` a `"01-hello-python"`), mientras el slug del paquete permanece igual:

- `reconcileTelemetry` acepta el blob (el slug del paquete coincide)
- En `normalizeTelemetrySchema`, `storedBySlug.get("01-hello-python")` devuelve `undefined`
- El step renombrado se inicializa como vacío, sin datos de actividad
- El step con el slug viejo (`"01-hello-world"`) se descarta silenciosamente

### Consecuencia

**Pérdida del historial de ese ejercicio específico**: el usuario que lo había completado vuelve a verlo como incompleto. Si el ejercicio es testeable, `is_completed` queda en `false` y el tutorial no avanza correctamente.

El resto de los ejercicios no se ve afectado si sus slugs no cambiaron.

### Relación con la lógica de "ejercicios eliminados"

El código asume que un step sin match en `freshSteps` fue **eliminado** del tutorial:

> "Steps in the stored blob that have no matching slug in freshSteps are discarded — they correspond to exercises removed from the tutorial."

Un renombramiento de slug es **indistinguible** de un remove + add desde la perspectiva del reconciliador. No hay mecanismo para distinguir ambos casos.

### Severidad

Media-alta. El ejercicio renombrado pierde su historial. Si el tutorial tiene muchos ejercicios y solo uno cambia de slug, el resto no se ve afectado.

### Reproducción

1. Usuario trabaja el ejercicio con slug `"01-hello-world"` y lo completa (tests pasan, `is_completed: true`).
2. El autor renombra la carpeta del ejercicio a `"01-hello-python"`.
3. El usuario vuelve a abrir el tutorial.
4. `normalizeTelemetrySchema` no encuentra `"01-hello-python"` en el mapa → step vacío → `is_completed: false`.

---

## Ausencia de salvaguardas actuales

No existe actualmente ningún mecanismo de mitigación:

| Mecanismo | ¿Existe? |
|---|---|
| Fallback por posición cuando no hay match por slug | No |
| Warning/log cuando se descartan steps con datos no vacíos | No |
| Mapping de slug viejo → slug nuevo en el config del tutorial | No |
| Fuzzy matching por similitud de slug | No |

---

## Aproximaciones posibles para el fix

Se listan de menor a mayor complejidad. No son excluyentes.

### Opción A: Fallback por posición (conservadora)

Cuando `storedBySlug.get(fresh.slug)` no encuentra match, intentar usar el step almacenado en la misma posición del array como fallback:

```typescript
const stored =
  storedBySlug.get(fresh.slug) ??
  storedSteps[freshIndex]; // fallback: misma posición
```

**Pros:** Sencillo, no requiere cambios en el formato de datos.
**Contras:** Puede provocar falsos positivos si se insertó/eliminó un ejercicio en medio de la lista (el fallback por posición mezclaría datos de un ejercicio con los de otro). Habría que añadir alguna heurística de confianza (ej. solo aplicar si los slugs son "suficientemente parecidos").

### Opción B: Heurística de similitud de slug

Si no hay match exacto, buscar en los stored steps el slug más similar al slug actual (distancia de Levenshtein u otro criterio). Si la similitud supera un umbral, usar esos datos.

**Pros:** Robusto ante renombramientos menores (ej. `"01-hello-world"` → `"01-hello-python"`).
**Contras:** Falsos positivos si dos slugs son accidentalmente similares. Añade dependencia o lógica de similitud de strings.

### Opción C: Campo de migración en `learn.json`

Añadir un campo opcional `slug_aliases` (o `previous_slug`) en la definición de cada ejercicio en `learn.json`. El reconciliador buscaría primero por slug actual, y si no hay match, por los aliases:

```json
{
  "slug": "01-hello-python",
  "slug_aliases": ["01-hello-world"]
}
```

**Pros:** Explícito y controlado por el autor del tutorial. Sin falsos positivos.
**Contras:** Requiere coordinación entre CLI (que lee `learn.json`) e IDE. El campo tiene que propagarse hasta `freshSteps`. Los autores tienen que acordarse de mantenerlo.

### Opción D: Log de warning ante descarte de datos no vacíos

Mínima intervención: no cambiar la lógica de merge, pero emitir un `console.warn` (o un evento de telemetría interna) cuando se descarta un step almacenado que tiene datos de actividad (`compilations.length > 0 || tests.length > 0 || is_completed === true`).

**Pros:** No cambia el comportamiento, solo hace el problema visible. Útil para debugging.
**Contras:** No resuelve el bug, solo lo hace detectable.

---

## Archivos a modificar cuando se implemente el fix

| Archivo | Función | Cambio esperado |
|---|---|---|
| `src/managers/telemetry.ts:587` | `normalizeTelemetrySchema` | Lógica de merge de steps con fallback/alias |
| `src/managers/telemetry.ts:214` | `reconcileTelemetry` | Posiblemente: manejo de slug del paquete con aliases |
| `src/managers/telemetry.ts:622` | Bloque interno de steps | Construir el mapa con slugs + aliases |

Si se implementa la Opción C, también afecta:
- `learnpack-cli/src/models/` — añadir `slug_aliases` al tipo de ejercicio
- `src/utils/store.tsx` — propagar el campo al construir `freshSteps`

---

## Notas adicionales

- El sistema **sí es robusto** ante **reordenamientos** de ejercicios: el fix de `currentExercisePosition` garantiza que los eventos se registran en el slot correcto del array. El problema de slugs es ortogonal a ese fix.
- Cuando el slug del paquete cambia y se crea un blob nuevo, los datos del blob viejo siguen en el servidor de Rigobot con el slug anterior. No hay pérdida en BigQuery, pero el cliente nunca los recupera. Un fix a nivel de servidor podría hacer una búsqueda por `user_id` independientemente del slug, pero eso está fuera del alcance del IDE.
