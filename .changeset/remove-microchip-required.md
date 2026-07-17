---
'@coongro/patients': patch
---

fix(settings): quita el toggle "microchip obligatorio" (inusable) y migra la capa de settings al Builder

- Elimina la setting `patients.required.microchip`: en la práctica ninguna clínica puede exigir microchip al registrar (la mayoría de las mascotas no lo tiene). El campo sigue disponible en el formulario, solo que nunca es obligatorio.
- Migra el hook de dominio `usePatientsSettings` a consumir la capa tipada generada por el Builder (`settings/settings.gen.ts`), manteniendo la lógica de especies habilitadas.
