---
'@coongro/patients': minor
---

feat(COONG-225 #9): exporta la taxonomía de especies como fuente única

Pacientes es el dueño de la taxonomía de especies, pero vet-pharmacy y vaccination
la duplicaban (lista de especies, labels/iconos y el normalizador de texto SENASA).
Ahora se exporta todo desde `@coongro/patients` para consumir sin copiar:

- `SPECIES` (array `{code,label,icon}`) + tipo `SpeciesDef` — fuente única; los
  maps `SPECIES_LABELS`/`SPECIES_ICON` se derivan de ahí.
- `SPECIES_ENABLED_DEFAULT` — defaults de especies habilitadas.
- `speciesCodeFromText(raw)` — normaliza texto libre/SENASA (canino, felino, ganado…)
  al código interno; reemplaza el `senasaSpeciesToCode` duplicado en otros plugins.
