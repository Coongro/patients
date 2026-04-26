# @coongro/patients

## 1.4.0

### Minor Changes

- 361a25e: fix(detail-views): patient-detail's delete now actually deletes (was just a toast); owner-detail gains delete handler (was missing). Both migrated to UI.ConfirmDialog and edit dialogs migrated to UI.FormDialogSubmit. PetDetail timestamps wrapped in compact Card with es-AR locale. PetDetail extraActions honor variant/icon. pet schema updated_at uses .$onUpdate() (COONG-112)
- 361a25e: refactor(ui): adopt FormSection + FormDialogSubmit from `@coongro/ui-components` 0.28.0 (COONG-112)
  - `PetForm` ahora envuelve cada sección (Dueño, Datos de la mascota, Estado, Alertas médicas, Datos veterinarios del dueño, Notas) en `UI.FormSection` (Card + ícono + título). El helper local `renderSection` ahora delega a `UI.FormSection`.
  - `CreatePetButton` migra a `UI.FormDialogSubmit`: footer sticky con botones Cancelar/Crear paciente.
  - El dialog interno de "Nuevo dueño" (creación rápida desde el ContactPicker) también migra a `UI.FormDialogSubmit`.
  - `PetFormProps` extendida con `formRef`, `hideActions`, `onSavingChange`. Compatible hacia atrás.

## 1.3.0

### Minor Changes

- 51952e7: Migrate `preferred_vet` (free text) to `preferred_vet_staff_id` with `StaffPicker` + `StaffBadge` from `@coongro/staff`, consistent with consultations `vet_name → staff_id` migration.

## 1.2.1

### Patch Changes

- 5a4e395: fix: migrate PetsTable to DataTable with mobileRender for mobile card view

## 1.2.0

### Minor Changes

- a110ea2: Use DatePicker from @coongro/calendar for birth date field

## 1.1.2

### Patch Changes

- f247946: Add Lucide icons to species enum options in settings dropdown

## 1.1.1

### Patch Changes

- ddb5b0d: Restore full species toggles and options in settings
  - Restore 6 individual species toggles (dog, cat, bird, reptile, rodent, other) in manifest
  - Restore all 6 options in default species enum (was reduced to only dog/cat)
  - Update usePatientsSettings to expose enabledSpecies map
  - Filter species options in PetForm and PetsTable by enabled species

## 1.1.0

### Minor Changes

- 41013ee: Redesign settings with realistic veterinary configurations
  - Add 7 realistic settings for veterinary clinics (Argentine market)
  - General page: default species, open detail on create, hide deceased, profile completeness
  - Registration page: required sex, birth date, and microchip fields
  - Migrate to SDK useSettings for real-time reactivity
  - Add excludeStatus filter for deceased patient filtering

### Patch Changes

- 6fc3ec3: Adopt core fixes: Avatar with icon prop, Mars/Venus gender icons, DynamicIcon species indicators

## 1.0.3

### Patch Changes

- 35cd6f5: fix(ci): correct release and publish workflows
  - Fix changesets/action version command (use shell script instead of inline &&)
  - Fix scoped registry override in production publish
  - Add tag creation and GitHub Release in publish workflow
  - Remove obsolete tag-release workflow
