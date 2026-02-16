/**
 * Formulario de crear/editar mascota.
 * Incluye ContactPicker de @coongro/contacts para seleccionar dueño.
 */
import { ContactPicker, ContactForm } from '@coongro/contacts';
import type { Contact } from '@coongro/contacts';
import { getHostReact, usePlugin } from '@coongro/plugin-sdk';

import { usePatientsSettings } from '../hooks/usePatientsSettings.js';
import { usePet } from '../hooks/usePet.js';
import { usePetMutations } from '../hooks/usePetMutations.js';
import { useVetOwnerMutations } from '../hooks/useVetOwnerMutations.js';
import type { PetFormProps } from '../types/components.js';
import type { Pet, PetCreateData } from '../types/pet.js';

const React = getHostReact();
const { useState, useEffect, useCallback, useRef } = React;

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

const inputClass =
  'w-full h-9 px-3 text-sm rounded-lg border border-[var(--cg-input-border)] bg-[var(--cg-input-bg)] text-[var(--cg-text)] placeholder:text-[var(--cg-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--cg-border-focus)]';

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
        allergies_text: Array.isArray(pet.allergies) ? pet.allergies.join(', ') : '',
        chronic_text: Array.isArray(pet.chronic_conditions)
          ? pet.chronic_conditions.join(', ')
          : '',
      });
    }
  }, [isEdit, pet]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

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

  // Cerrar modal con ESC
  useEffect(() => {
    if (!showCreateContact) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCreateContact(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showCreateContact]);

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

      // Parsear listas de texto a arrays
      const allergiesText = (formData.allergies_text as string) ?? '';
      const chronicText = (formData.chronic_text as string) ?? '';
      const allergies = allergiesText
        ? allergiesText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : null;
      const chronicConditions = chronicText
        ? chronicText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
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
        React.createElement('div', {
          key: i,
          className: 'h-10 rounded-lg bg-[var(--cg-skeleton)] animate-pulse',
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
      renderField(
        'Alergias',
        'allergies_text',
        'text',
        formData,
        handleChange,
        false,
        'Separadas por coma: penicilina, ibuprofeno...'
      ),
      renderField(
        'Condiciones crónicas',
        'chronic_text',
        'text',
        formData,
        handleChange,
        false,
        'Separadas por coma: displasia, diabetes...'
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
        React.createElement('textarea', {
          value: (formData.notes as string) ?? '',
          onChange: (e: { target: { value: string } }) => handleChange('notes', e.target.value),
          placeholder: 'Notas adicionales...',
          rows: 3,
          className: `${inputClass} h-auto py-2 resize-none`,
        })
      )
    ),

    // Acciones
    React.createElement(
      'div',
      { className: 'flex gap-3 pt-2' },
      React.createElement(
        'button',
        {
          type: 'submit',
          disabled: isSaving || !formData.name || !formData.owner_id,
          className:
            'flex-1 h-10 rounded-lg text-sm font-medium bg-[var(--cg-accent)] text-[var(--cg-text-inverse)] hover:bg-[var(--cg-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
        },
        isSaving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear paciente'
      ),
      onCancel &&
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: onCancel,
            className:
              'px-6 h-10 rounded-lg text-sm border border-[var(--cg-border)] text-[var(--cg-text)] hover:bg-[var(--cg-bg-hover)] transition-colors',
          },
          'Cancelar'
        )
    )
    ), // cierre del form

    // Modal para crear contacto nuevo
    showCreateContact &&
      React.createElement(
        'div',
        {
          className: 'fixed inset-0 z-[300] flex items-center justify-center',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onClick: (e: any) => {
            if (e.target === e.currentTarget) setShowCreateContact(false);
          },
        },
        React.createElement('div', {
          className: 'absolute inset-0 bg-[var(--cg-bg-overlay)]',
        }),
        React.createElement(
          'div',
          {
            className:
              'relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl border border-[var(--cg-border)] bg-[var(--cg-bg)] shadow-xl animate-in fade-in-0 zoom-in-95',
          },
          React.createElement(
            'div',
            {
              className:
                'flex items-center justify-between px-6 py-4 border-b border-[var(--cg-border)]',
            },
            React.createElement(
              'h2',
              { className: 'text-lg font-semibold text-[var(--cg-text)]' },
              'Nuevo dueño'
            ),
            React.createElement(
              'button',
              {
                type: 'button',
                onClick: () => setShowCreateContact(false),
                className:
                  'p-1.5 rounded-md text-[var(--cg-text-muted)] hover:bg-[var(--cg-bg-hover)]',
              },
              React.createElement(
                'svg',
                {
                  width: 18,
                  height: 18,
                  viewBox: '0 0 24 24',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 2,
                },
                React.createElement('path', { d: 'M18 6L6 18M6 6l12 12' })
              )
            )
          ),
          React.createElement(
            'div',
            { className: 'p-6' },
            React.createElement(ContactForm, {
              defaults: { name: createContactName, type: 'person' },
              hiddenFields: ['type'],
              onSuccess: handleContactCreated,
              onCancel: () => setShowCreateContact(false),
            })
          )
        )
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
      { className: 'text-sm font-medium text-[var(--cg-text-muted)] uppercase tracking-wider' },
      title
    ),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    ...children
  );
}

function renderLabel(label: string, required = false) {
  return React.createElement(
    'label',
    { className: 'text-sm font-medium text-[var(--cg-text)]' },
    label,
    required && React.createElement('span', { className: 'text-[var(--cg-danger)] ml-0.5' }, '*')
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
    React.createElement('input', {
      type,
      value: (data[key] as string) ?? '',
      onChange: (e: { target: { value: string } }) => onChange(key, e.target.value),
      placeholder,
      required,
      className: inputClass,
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
      'select',
      {
        value: (data[key] as string) ?? '',
        onChange: (e: { target: { value: string } }) => onChange(key, e.target.value),
        className: inputClass,
      },
      React.createElement('option', { value: '' }, `Seleccionar...`),
      options.map((opt) =>
        React.createElement('option', { key: opt.value, value: opt.value }, opt.label)
      )
    )
  );
}
