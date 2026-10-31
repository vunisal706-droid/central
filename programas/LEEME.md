# Programas del cole · puesta en marcha

App en `https://vunisal706-droid.github.io/central/programas/`. Usa el proyecto de Firebase
`gestorpt-7946b` (las mismas cuentas IdEA que Gestor PT y Refuerzo), en la rama `programas/`.

## Reglas de Firebase
Realtime Database → Reglas. **No borres nada**: añade este bloque dentro de `"rules"`,
junto a `"refuerzo"`, `"gestorpe"`… (cuidado con las comas).

```json
"programas": {
  ".read":  "auth != null && (auth.token.email == 'vunisal706@capitulaciones.local' || auth.token.email == 'mrodrod323@capitulaciones.local' || auth.token.email == 'emunrom369@capitulaciones.local' || auth.token.email == 'mromrod681@capitulaciones.local' || auth.token.email == 'cmolmar422@capitulaciones.local')",
  ".write": "auth != null && (auth.token.email == 'vunisal706@capitulaciones.local' || auth.token.email == 'mrodrod323@capitulaciones.local' || auth.token.email == 'emunrom369@capitulaciones.local' || auth.token.email == 'mromrod681@capitulaciones.local' || auth.token.email == 'cmolmar422@capitulaciones.local')"
}
```

## Datos
`programas/cursos/<2026-27>/` → hechos (plazos), grupos, sesiones, reuniones, palancas, retos, informes y cotejo.
El alumnado se guarda solo por siglas.

Los plazos (`plazos.js`) se copian de la Agenda del Equipo Directivo; las palancas (`palancas.js`) del Plan de Actividades Palanca 2026/27.
