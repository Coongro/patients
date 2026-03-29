---
"@coongro/patients": patch
---

Restore full species toggles and options in settings

- Restore 6 individual species toggles (dog, cat, bird, reptile, rodent, other) in manifest
- Restore all 6 options in default species enum (was reduced to only dog/cat)
- Update usePatientsSettings to expose enabledSpecies map
- Filter species options in PetForm and PetsTable by enabled species
