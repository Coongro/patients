---
'@coongro/patients': minor
---

fix(detail-views): patient-detail's delete now actually deletes (was just a toast); owner-detail gains delete handler (was missing). Both migrated to UI.ConfirmDialog and edit dialogs migrated to UI.FormDialogSubmit. PetDetail timestamps wrapped in compact Card with es-AR locale. PetDetail extraActions honor variant/icon. pet schema updated_at uses .$onUpdate() (COONG-112)
