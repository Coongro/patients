/**
 * Formulario de crear/editar mascota.
 * Incluye ContactPicker de @coongro/contacts para seleccionar dueño.
 */
import { ContactPicker, ContactForm } from '@coongro/contacts';
import type { Contact } from '@coongro/contacts';
import { getHostReact, getHostUI, usePlugin } from '@coongro/plugin-sdk';

import { usePatientsSettings } from '../hooks/usePatientsSettings.js';
import { usePet } from '../hooks/usePet.js';
import { usePetMutations } from '../hooks/usePetMutations.js';
import { useVetOwnerMutations } from '../hooks/useVetOwnerMutations.js';
import type { PetFormProps } from '../types/components.js';
import type { Pet, PetCreateData } from '../types/pet.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useEffect, useCallback } = React;

const ALL_SPECIES_OPTIONS: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  bird: 'Ave',
  reptile: 'Reptil',
  rodent: 'Roedor',
  other: 'Otro',
};

const SEX_OPTIONS = [
  { label: 'Macho', value: 'male' },
  { label: 'Hembra', value: 'female' },
  { label: 'Desconocido', value: 'unknown' },
];

const STATUS_OPTIONS = [
  { label: 'Activo', value: 'active' },
  { label: 'Fallecido', value: 'deceased' },
  { label: 'Derivado', value: 'referred' },
  { label: 'Perdido', value: 'lost' },
];

const REPRODUCTIVE_OPTIONS = [
  { label: 'Entero/a', value: 'intact' },
  { label: 'Castrado', value: 'neutered' },
  { label: 'Esterilizada', value: 'spayed' },
];

const REFERRAL_OPTIONS = [
  { label: 'Recomendación', value: 'referral' },
  { label: 'Google', value: 'google' },
  { label: 'Redes sociales', value: 'social' },
  { label: 'Pasó por el local', value: 'walk_in' },
  { label: 'Otro', value: 'other' },
];

export function PetForm(props: PetFormProps) {
  const { petId, defaults = {}, onSuccess, onCancel, className = '' } = props;

  const isEdit = !!petId;
  const { pet, loading: loadingPet } = usePet(petId);
  const { create, update, creating, updating } = usePetMutations();
  const { ensureOwner } = useVetOwnerMutations();
  const { toast } = usePlugin();
  const { settings: pSettings } = usePatientsSettings();

  // Opciones de especie filtradas según settings
  const speciesOptions = pSettings.enabledSpecies.map((code) => ({
    label: ALL_SPECIES_OPTIONS[code] ?? code,
    value: code,
  }));

  const [formData, setFormData] = useState<Record<string, unknown>>({
    species: pSettings.defaultSpecies,
    status: 'active',
    is_active: true,
    ...defaults,
  });

  // Datos veterinarios del dueño
  const [vetData, setVetData] = useState<Record<string, unknown>>({});

  // Inputs controlados para ChipInput (Enter para agregar chip)
  const [allergyInput, setAllergyInput] = useState('');
  const [chronicInput, setChronicInput] = useState('');

  // Modal para crear contacto desde el picker
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [createContactName, setCreateContactName] = useState('');

  useEffect(() => {
    if (isEdit && pet) {
      setFormData({
        name: pet.name,
        species: pet.species,
        breed: pet.breed ?? '',
        sex: pet.sex ?? '',
        color_markings: pet.color_markings ?? '',
        birth_date: pet.birth_date ?? '',
        weight_kg: pet.weight_kg ?? '',
        microchip_number: pet.microchip_number ?? '',
        owner_id: pet.owner_id,
        photo_url: pet.photo_url ?? '',
        status: pet.status,
        reproductive_status: pet.reproductive_status ?? '',
        notes: pet.notes ?? '',
        is_active: pet.is_active,
        allergies_list: Array.isArray(pet.allergies) ? pet.allergies : [],
        chronic_list: Array.isArray(pet.chronic_conditions) ? pet.chronic_conditions : [],
      });
    }
  }, [isEdit, pet]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** Crea un handler de Enter para agregar chips a una lista en formData */
  const makeChipKeyDown = useCallback(
    (listKey: string, inputValue: string, clearInput: (v: string) => void) =>
      (e: { key: string; preventDefault: () => void }) => {
        if (e.key !== 'Enter' || !inputValue.trim()) return;
        e.preventDefault();
        const current = (formData[listKey] as string[]) ?? [];
        handleChange(listKey, [...current, inputValue.trim()]);
        clearInput('');
      },
    [formData, handleChange]
  );

  const handleVetChange = useCallback((key: string, value: unknown) => {
    setVetData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Abrir modal de crear contacto desde ContactPicker
  const handleCreateContactClick = useCallback((query: string) => {
    setCreateContactName(query);
    setShowCreateContact(true);
  }, []);

  // Al crear contacto exitosamente, seleccionar como dueño
  const handleContactCreated = useCallback(
    (contact: Contact) => {
      handleChange('owner_id', contact.id);
      setShowCreateContact(false);
    },
    [handleChange]
  );

  const handleSubmit = useCallback(
    async (e: { preventDefault: () => void }) => {
      e.preventDefault();

      // Validaciones
      const name = (formData.name as string)?.trim();
      if (!name || name.length < 2) {
        toast.error('Validación', 'El nombre debe tener al menos 2 caracteres');
        return;
      }

      if (!formData.owner_id) {
        toast.error('Validación', 'Debe seleccionar un dueño');
        return;
      }

      if (pSettings.requireSex && !formData.sex) {
        toast.error('Validación', 'Debe seleccionar el sexo');
        return;
      }

      const birthDate = formData.birth_date as string;
      if (pSettings.requireBirthDate && !birthDate) {
        toast.error('Validación', 'Debe indicar la fecha de nacimiento');
        return;
      }
      if (birthDate && new Date(birthDate) > new Date()) {
        toast.error('Validación', 'La fecha de nacimiento no puede ser futura');
        return;
      }

      if (pSettings.requireMicrochip && !formData.microchip_number) {
        toast.error('Validación', 'Debe indicar el número de microchip');
        return;
      }

      const weight = formData.weight_kg ? Number(formData.weight_kg) : null;
      if (weight !== null && (weight <= 0 || weight >= 200)) {
        toast.error('Validación', 'El peso debe ser positivo y menor a 200 kg');
        return;
      }

      const allergies = (formData.allergies_list as string[])?.length
        ? (formData.allergies_list as string[])
        : null;
      const chronicConditions = (formData.chronic_list as string[])?.length
        ? (formData.chronic_list as string[])
        : null;

      const petData: PetCreateData = {
        name,
        species: formData.species as string,
        breed: (formData.breed as string) || null,
        sex: (formData.sex as string) || null,
        color_markings: (formData.color_markings as string) || null,
        birth_date: birthDate || null,
        weight_kg: weight ? String(weight) : null,
        microchip_number: (formData.microchip_number as string) || null,
        owner_id: formData.owner_id as string,
        photo_url: (formData.photo_url as string) || null,
        status: (formData.status as string) || 'active',
        reproductive_status: (formData.reproductive_status as string) || null,
        allergies,
        chronic_conditions: chronicConditions,
        notes: (formData.notes as string) || null,
        is_active: formData.is_active as boolean,
      };

      let result: Pet | null;
      if (isEdit && petId) {
        result = await update(petId, petData);
      } else {
        result = await create(petData);
      }

      if (result) {
        // Guardar datos vet del dueño si hay algo
        const hasVetData = Object.values(vetData).some((v) => v);
        if (hasVetData) {
          await ensureOwner(result.owner_id, vetData as Record<string, string>);
        }
        onSuccess?.(result);
      }
    },
    [formData, vetData, isEdit, petId, create, update, ensureOwner, onSuccess, toast]
  );

  const isSaving = creating || updating;

  if (isEdit && loadingPet) {
    return React.createElement(
      'div',
      { className: 'flex flex-col gap-4 p-4' },
      Array.from({ length: 8 }).map((_, i) =>
        React.createElement(UI.Skeleton, {
          key: i,
          className: 'h-10 rounded-lg',
        })
      )
    );
  }

  return React.createElement(
    React.Fragment,
    null,

    React.createElement(
    'form',
    { onSubmit: handleSubmit, className: `flex flex-col gap-6 ${className}` },

    // Sección 1: Dueño
    renderSection(
      'Dueño',
      React.createElement(
        'div',
        { className: 'flex flex-col gap-1.5' },
        renderLabel('Dueño', true),
        React.createElement(ContactPicker, {
          placeholder: 'Buscar dueño...',
          value: (formData.owner_id as string) ?? null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          onChange: (c: { id?: string } | null) => handleChange('owner_id', c?.id ?? null),
          allowCreate: true,
          onCreateClick: handleCreateContactClick,
          filters: { type: 'person' },
        })
      )
    ),

    // Sección 2: Datos de la mascota
    renderSection(
      'Datos de la mascota',
      renderField('Nombre', 'name', 'text', formData, handleChange, true, 'Nombre de la mascota'),
      renderSelect('Especie', 'species', speciesOptions, formData, handleChange, true),
      renderField('Raza', 'breed', 'text', formData, handleChange, false, 'Raza'),
      renderSelect('Sexo', 'sex', SEX_OPTIONS, formData, handleChange, pSettings.requireSex),
      renderField('Fecha nacimiento', 'birth_date', 'date', formData, handleChange, pSettings.requireBirthDate, ''),
      renderField(
        'Color/Señas',
        'color_markings',
        'text',
        formData,
        handleChange,
        false,
        'Color y señas particulares'
      ),
      renderField('Peso (kg)', 'weight_kg', 'number', formData, handleChange, false, 'Ej: 28.5'),
      renderField(
        'Microchip',
        'microchip_number',
        'text',
        formData,
        handleChange,
        pSettings.requireMicrochip,
        'Nro de microchip'
      )
    ),

    // Sección 3: Estado
    renderSection(
      'Estado',
      renderSelect('Estado', 'status', STATUS_OPTIONS, formData, handleChange),
      renderSelect(
        'Estado reproductivo',
        'reproductive_status',
        REPRODUCTIVE_OPTIONS,
        formData,
        handleChange
      )
    ),

    // Sección 4: Alertas médicas
    renderSection(
      'Alertas médicas',
      React.createElement(
        'div',
        { className: 'flex flex-col gap-1.5' },
        renderLabel('Alergias'),
        React.createElement(UI.ChipInput, {
          values: (formData.allergies_list as string[]) ?? [],
          onValuesChange: (vals: string[]) => handleChange('allergies_list', vals),
          inputValue: allergyInput,
          onInputChange: setAllergyInput,
          placeholder: 'Escribí y presioná Enter...',
          onKeyDown: makeChipKeyDown('allergies_list', allergyInput, setAllergyInput),
        })
      ),
      React.createElement(
        'div',
        { className: 'flex flex-col gap-1.5' },
        renderLabel('Condiciones crónicas'),
        React.createElement(UI.ChipInput, {
          values: (formData.chronic_list as string[]) ?? [],
          onValuesChange: (vals: string[]) => handleChange('chronic_list', vals),
          inputValue: chronicInput,
          onInputChange: setChronicInput,
          placeholder: 'Escribí y presioná Enter...',
          onKeyDown: makeChipKeyDown('chronic_list', chronicInput, setChronicInput),
        })
      )
    ),

    // Sección 5: Datos vet del dueño (solo en creación)
    !isEdit &&
      renderSection(
        'Datos veterinarios del dueño',
        renderField(
          'Tel. emergencia',
          'emergency_phone',
          'tel',
          vetData,
          handleVetChange,
          false,
          '+54 11 9999-0000'
        ),
        renderField(
          'Veterinario preferido',
          'preferred_vet',
          'text',
          vetData,
          handleVetChange,
          false,
          'Dr. García'
        ),
        renderSelect(
          'Cómo nos conoció',
          'referral_source',
          REFERRAL_OPTIONS,
          vetData,
          handleVetChange
        )
      ),

    // Sección 6: Notas
    renderSection(
      'Notas',
      React.createElement(
        'div',
        { className: 'flex flex-col gap-1.5' },
        renderLabel('Notas'),
        React.createElement(UI.Textarea, {
          value: (formData.notes as string) ?? '',
          onChange: (e: { target: { value: string } }) => handleChange('notes', e.target.value),
          placeholder: 'Notas adicionales...',
          rows: 3,
        })
      )
    ),

    // Acciones
    React.createElement(
      'div',
      { className: 'flex gap-3 pt-2' },
      React.createElement(
        UI.Button,
        {
          type: 'submit',
          disabled: isSaving || !formData.name || !formData.owner_id,
          className: 'flex-1',
        },
        isSaving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear paciente'
      ),
      onCancel &&
        React.createElement(
          UI.Button,
          {
            type: 'button',
            variant: 'outline',
            onClick: onCancel,
          },
          'Cancelar'
        )
    )
    ), // cierre del form

    // Modal para crear contacto nuevo
    React.createElement(
      UI.FormDialog,
      {
        open: showCreateContact,
        onOpenChange: setShowCreateContact,
        title: 'Nuevo dueño',
        size: 'md',
      },
      React.createElement(ContactForm, {
        defaults: { name: createContactName, type: 'person' },
        hiddenFields: ['type'],
        onSuccess: handleContactCreated,
        onCancel: () => setShowCreateContact(false),
      })
    )
  );
}

// --- Helpers de renderizado ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderSection(title: string, ...children: any[]) {
  return React.createElement(
    'div',
    { className: 'flex flex-col gap-3' },
    React.createElement(
      'h3',
      { className: 'text-sm font-medium text-cg-text-muted uppercase tracking-wider' },
      title
    ),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    ...children
  );
}

function renderLabel(label: string, required = false) {
  return React.createElement(
    UI.Label,
    null,
    label,
    required && React.createElement('span', { className: 'text-cg-danger ml-0.5' }, '*')
  );
}

function renderField(
  label: string,
  key: string,
  type: string,
  data: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void,
  required = false,
  placeholder = ''
) {
  return React.createElement(
    'div',
    { className: 'flex flex-col gap-1.5' },
    renderLabel(label, required),
    React.createElement(UI.Input, {
      type,
      value: (data[key] as string) ?? '',
      onChange: (e: { target: { value: string } }) => onChange(key, e.target.value),
      placeholder,
      required,
      step: type === 'number' ? '0.1' : undefined,
    })
  );
}

function renderSelect(
  label: string,
  key: string,
  options: Array<{ label: string; value: string }>,
  data: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void,
  required = false
) {
  return React.createElement(
    'div',
    { className: 'flex flex-col gap-1.5' },
    renderLabel(label, required),
    React.createElement(
      UI.Select,
      {
        value: (data[key] as string) ?? '',
        onValueChange: (v: string) => onChange(key, v),
        placeholder: 'Seleccionar...',
        clearable: !required,
        debounceMs: 0,
      },
      options.map((opt) =>
        React.createElement(UI.SelectItem, { key: opt.value, value: opt.value }, opt.label)
      )
    )
  );
}
