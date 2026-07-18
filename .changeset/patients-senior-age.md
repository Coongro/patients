---
'@coongro/patients': minor
---

feat(pacientes): marca "Senior" en la ficha según umbral por especie (COONG-248)

Nuevas settings `patients.seniorAge.dog` (default 7) y `patients.seniorAge.cat` (default 10): a partir de esa edad, el paciente muestra un badge "Senior" en su ficha para reforzar controles. Solo perro y gato tienen umbral; el resto de las especies no se marca. Editable desde `/dev/builder` (página "Especies y ficha" → "Edad senior").
