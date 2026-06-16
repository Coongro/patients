---
'@coongro/patients': minor
---

feat(COONG-208): rediseño de ficha de Paciente y de Dueño

- Ficha de Paciente (`PetDetail`): header de identidad por especie con paleta,
  chips vitales, banner de estado, alertas médicas, grilla de info con iconos,
  panel del dueño y secciones de módulos inyectados. Layout responsive por JS
  (no depende del CSS del plugin) para evitar la carrera de carga.
- Ficha de Dueño (`owner-detail`): vista propia con card de identidad + riel de
  contacto, "Sus mascotas" (petcards con paleta), "Datos veterinarios" y notas.
- Tokens semánticos `cg-*` (dark mode), iconos Lucide coherentes.
