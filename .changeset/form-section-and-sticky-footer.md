---
'@coongro/patients': minor
---

refactor(ui): adopt FormSection + FormDialogSubmit from `@coongro/ui-components` 0.28.0 (COONG-112)

- `PetForm` ahora envuelve cada sección (Dueño, Datos de la mascota, Estado, Alertas médicas, Datos veterinarios del dueño, Notas) en `UI.FormSection` (Card + ícono + título). El helper local `renderSection` ahora delega a `UI.FormSection`.
- `CreatePetButton` migra a `UI.FormDialogSubmit`: footer sticky con botones Cancelar/Crear paciente.
- El dialog interno de "Nuevo dueño" (creación rápida desde el ContactPicker) también migra a `UI.FormDialogSubmit`.
- `PetFormProps` extendida con `formRef`, `hideActions`, `onSavingChange`. Compatible hacia atrás.
