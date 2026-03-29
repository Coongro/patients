# @coongro/patients

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
