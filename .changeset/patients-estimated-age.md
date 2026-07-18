---
'@coongro/patients': minor
---

feat(pacientes): edad estimada además de fecha de nacimiento exacta (COONG-248)

La fecha de nacimiento del paciente ahora se puede cargar de dos maneras: **fecha exacta** (date picker, como antes) o **edad aproximada** (años + meses), que es lo habitual porque casi nunca se conoce la fecha real. Al elegir edad aproximada se deriva una fecha de nacimiento anclada al primer día del mes y se marca como estimada (nueva columna `birth_date_estimated`); en la ficha y las tarjetas la edad estimada se muestra como "~X años". La setting antes llamada "Fecha de nacimiento obligatoria" pasó a "Edad o fecha de nacimiento obligatoria" (misma key `patients.required.birthDate`). Incluye la migración `0002` que agrega la columna (aditiva, default false).
