/**
 * Formulario de crear/editar mascota.
 * Incluye ContactPicker de @coongro/contacts para seleccionar dueño.
 */
import { ContactPicker, ContactForm } from '@coongro/contacts';
import type { Contact } from '@coongro/contacts';
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { usePatientsSettings } from '../hooks/usePatientsSettings.js';
import { usePet } from '../hooks/usePet.js';
import { usePetFormSubmit } from '../hooks/usePetFormSubmit.js';
import type { PetFormProps } from '../types/components.js';
import {
  SPECIES_LABELS,
  SPECIES_ICON,
  REFERRAL_LABELS,
  toSelectOptions,
  SEX_LABELS,
  STATUS_LABELS,
  REPRODUCTIVE_LABELS,
} from '../utils/labels.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useEffect, useCallback, useRef } = React;

const FIELD_CLASS = 'flex flex-col gap-1.5';
const SEX_OPTIONS = toSelectOptions(SEX_LABELS);
const STATUS_OPTIONS = toSelectOptions(STATUS_LABELS);
const REPRODUCTIVE_OPTIONS = toSelectOptions(REPRODUCTIVE_LABELS);
const REFERRAL_OPTIONS = toSelectOptions(REFERRAL_LABELS);

const STATUS_ICON: Record<string, string> = {
  active: 'CircleCheck',
  deceased: 'CircleX',
  referred: 'ArrowRightLeft',
  lost: 'CircleAlert',
};

const REFERRAL_ICON: Record<string, string> = {
  referral: 'UserPlus',
  google: 'Search',
  social: 'Share2',
  walk_in: 'Store',
  other: 'MoreHorizontal',
};

const SEX_ICON: Record<string, string> = {
  male: 'Mars',
  female: 'Venus',
  unknown: 'CircleHelp',
};

const REPRODUCTIVE_ICON: Record<string, string> = {
  intact: 'ShieldCheck',
  neutered: 'Scissors',
  spayed: 'Scissors',
};

export function PetForm(props: PetFormProps) {
  const { petId, defaults = {}, onSuccess, onCancel, className = '' } = props;

  const isEdit = !!petId;
  const { pet, loading: loadingPet } = usePet(petId);
  const { settings: pSettings } = usePatientsSettings();
  const { submit, isSaving } = usePetFormSubmit({ petId, settings: pSettings, onSuccess });

  const speciesOptions = toSelectOptions(SPECIES_LABELS).filter(
    (opt) => pSettings.enabledSpecies[opt.value] !== false
  );

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

  // Controla si el usuario ya cambió la especie manualmente
  const userChangedSpecies = useRef(false);

  // Modal para crear contacto desde el picker
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [createContactName, setCreateContactName] = useState('');

  // Sincronizar especie por defecto cuando los settings cargan (solo en creación, si el usuario no cambió)
  useEffect(() => {
    if (!isEdit && pSettings.defaultSpecies && !userChangedSpecies.current) {
      setFormData((prev) => ({
        ...prev,
        species: pSettings.defaultSpecies,
      }));
    }
  }, [isEdit, pSettings.defaultSpecies]);

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
      await submit(formData, vetData);
    },
    [formData, vetData, submit]
  );

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
        'User',
        React.createElement(
          'div',
          { className: FIELD_CLASS },
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
        'PawPrint',
        renderField('Nombre', 'name', 'text', formData, handleChange, true, 'Nombre de la mascota'),
        React.createElement(
          'div',
          { className: FIELD_CLASS },
          renderLabel('Especie', true),
          React.createElement(
            UI.Select,
            {
              value: (formData.species as string) ?? '',
              onValueChange: (v: string) => {
                userChangedSpecies.current = true;
                handleChange('species', v);
              },
              placeholder: 'Seleccionar...',
              debounceMs: 0,
            },
            speciesOptions.map((opt) =>
              React.createElement(
                UI.SelectItem,
                {
                  key: opt.value,
                  value: opt.value,
                  icon: React.createElement(UI.DynamicIcon, {
                    icon: SPECIES_ICON[opt.value] ?? 'PawPrint',
                    size: 16,
                  }),
                },
                opt.label
              )
            )
          )
        ),
        renderField('Raza', 'breed', 'text', formData, handleChange, false, 'Raza'),
        React.createElement(
          'div',
          { className: FIELD_CLASS },
          renderLabel('Sexo', pSettings.requireSex),
          React.createElement(
            UI.Select,
            {
              value: (formData.sex as string) ?? '',
              onValueChange: (v: string) => handleChange('sex', v),
              placeholder: 'Seleccionar...',
              clearable: !pSettings.requireSex,
              debounceMs: 0,
            },
            SEX_OPTIONS.map((opt) =>
              React.createElement(
                UI.SelectItem,
                {
                  key: opt.value,
                  value: opt.value,
                  icon: React.createElement(UI.DynamicIcon, {
                    icon: SEX_ICON[opt.value] ?? 'Circle',
                    size: 16,
                  }),
                },
                opt.label
              )
            )
          )
        ),
        renderField(
          'Fecha nacimiento',
          'birth_date',
          'date',
          formData,
          handleChange,
          pSettings.requireBirthDate,
          ''
        ),
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
        'Activity',
        React.createElement(
          'div',
          { className: FIELD_CLASS },
          renderLabel('Estado'),
          React.createElement(
            UI.Select,
            {
              value: (formData.status as string) ?? '',
              onValueChange: (v: string) => handleChange('status', v),
              placeholder: 'Seleccionar...',
              debounceMs: 0,
            },
            STATUS_OPTIONS.map((opt) =>
              React.createElement(
                UI.SelectItem,
                {
                  key: opt.value,
                  value: opt.value,
                  icon: React.createElement(UI.DynamicIcon, {
                    icon: STATUS_ICON[opt.value] ?? 'Circle',
                    size: 16,
                  }),
                },
                opt.label
              )
            )
          )
        ),
        React.createElement(
          'div',
          { className: FIELD_CLASS },
          renderLabel('Estado reproductivo'),
          React.createElement(
            UI.Select,
            {
              value: (formData.reproductive_status as string) ?? '',
              onValueChange: (v: string) => handleChange('reproductive_status', v),
              placeholder: 'Seleccionar...',
              clearable: true,
              debounceMs: 0,
            },
            REPRODUCTIVE_OPTIONS.map((opt) =>
              React.createElement(
                UI.SelectItem,
                {
                  key: opt.value,
                  value: opt.value,
                  icon: React.createElement(UI.DynamicIcon, {
                    icon: REPRODUCTIVE_ICON[opt.value] ?? 'Circle',
                    size: 16,
                  }),
                },
                opt.label
              )
            )
          )
        )
      ),

      // Sección 4: Alertas médicas
      renderSection(
        'Alertas médicas',
        'AlertTriangle',
        React.createElement(
          'div',
          { className: FIELD_CLASS },
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
          { className: FIELD_CLASS },
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
          'Stethoscope',
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
          React.createElement(
            'div',
            { className: FIELD_CLASS },
            renderLabel('Cómo nos conoció'),
            React.createElement(
              UI.Select,
              {
                value: (vetData.referral_source as string) ?? '',
                onValueChange: (v: string) => handleVetChange('referral_source', v),
                placeholder: 'Seleccionar...',
                clearable: true,
                debounceMs: 0,
              },
              REFERRAL_OPTIONS.map((opt) =>
                React.createElement(
                  UI.SelectItem,
                  {
                    key: opt.value,
                    value: opt.value,
                    icon: React.createElement(UI.DynamicIcon, {
                      icon: REFERRAL_ICON[opt.value] ?? 'MoreHorizontal',
                      size: 16,
                    }),
                  },
                  opt.label
                )
              )
            )
          )
        ),

      // Sección 6: Notas
      renderSection(
        'Notas',
        'FileText',
        React.createElement(
          'div',
          { className: FIELD_CLASS },
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
function renderSection(title: string, icon: string, ...children: any[]) {
  return React.createElement(
    'div',
    { className: 'flex flex-col gap-3' },
    React.createElement(
      'h3',
      { className: 'flex items-center gap-2 text-sm font-medium text-cg-text-muted' },
      React.createElement(UI.DynamicIcon, { icon, size: 14, className: 'text-cg-text-muted' }),
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
    { className: FIELD_CLASS },
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
