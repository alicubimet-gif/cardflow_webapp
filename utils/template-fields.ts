// ─── CardFlow Studio — Template Field Type System ─────────────────────────────
//
// This module is the single source of truth for field type classification.
// Every layer (Field Builder, Canvas Designer, Records Form, PDF renderer)
// must derive its behavior from the helpers exported here.

import { SITE_URL } from '@/lib/config';

export type FieldTypeClass = 'text_input' | 'media_upload' | 'auto_generator';

export interface RuleCondition {
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'empty' | 'not_empty';
  value?: string;
}

export interface FieldRule {
  action: 'show' | 'hide' | 'enable' | 'disable' | 'set_default';
  matchType: 'all' | 'any';
  conditions: RuleCondition[];
  actionValue?: string; // used when action is 'set_default'
}

export interface TemplateFieldDefinition {
  id: string;
  label: string;
  type: string;
  required: boolean;
  visible: boolean;
  placeholder?: string;
  default_value?: string | null;
  validation_rules?: Record<string, unknown>;
  conditional_rules?: FieldRule[];
  options?: string[];
  /** For qr_code / barcode: which record value to encode at print time */
  source_context?: string;
  source_field?: string;
  enable_qr?: boolean;
  enable_barcode?: boolean;
  category?: string;
}

const getVerificationUrl = (idVal: string) => {
  const baseUrl = SITE_URL.replace(/\/$/, '');
  return baseUrl ? `${baseUrl}/verify/${idVal}` : `/verify/${idVal}`;
};

// ─── Type Metadata ─────────────────────────────────────────────────────────────

export interface FieldTypeConfig {
  value: string;
  label: string;
  /** Behavioral class that drives rendering decisions across all layers */
  class: FieldTypeClass;
  /** Short description shown in the type picker */
  description: string;
  /** Icon key for UI rendering */
  icon: string;
}

export const TEMPLATE_FIELD_TYPES: FieldTypeConfig[] = [
  // ── Text & Data ─────────────────────────────────────────────────────────────
  { value: 'text',      label: 'Text Field',      class: 'text_input',    description: 'Single-line text field',         icon: 'type' },
  
  // ── Media ─────────────────────────────────────────────────────────────
  { value: 'image',     label: 'Profile Image',   class: 'media_upload',  description: 'Upload a portrait image',        icon: 'image' },
] as const;

// ─── Type Classification Helpers ───────────────────────────────────────────────

/**
 * Returns the behavioral class of a field type.
 * Drives rendering decisions across forms, canvas, and PDF layers.
 */
export function getFieldTypeClass(type: string): FieldTypeClass {
  const config = TEMPLATE_FIELD_TYPES.find(t => t.value === type);
  return config?.class ?? 'text_input';
}

export function isMediaField(type: string): boolean {
  return getFieldTypeClass(type) === 'media_upload';
}

export function isAutoGeneratorField(type: string): boolean {
  return getFieldTypeClass(type) === 'auto_generator';
}

export function isTextInputField(type: string): boolean {
  return getFieldTypeClass(type) === 'text_input';
}

/**
 * Returns the canvas element_type stamp when a field is dragged onto the designer.
 * This is the binding contract between the Field Builder and the Canvas layer.
 *
 *   Standard Text Fields → element_type: "field"
 *   Media Fields         → element_type: "image_field"
 *   QR Code Fields       → element_type: "qr_field"
 *   Barcode Fields       → element_type: "barcode_field"
 */
export function getCanvasElementType(fieldType: string): string {
  switch (fieldType) {
    case 'image':
    case 'photo':
    case 'signature':
      return 'image_field';
    case 'qr_code':
      return 'qr_field';
    case 'barcode':
      return 'barcode_field';
    default:
      return 'field';
  }
}

/**
 * Maps the canvas element_type stamp back to the designer ElementType enum.
 * Used when adding a template field to the canvas.
 */
export function getDesignerElementType(fieldType: string): string {
  switch (fieldType) {
    case 'photo':
      return 'PHOTO';
    case 'image':
    case 'signature':
      return 'SIGNATURE';
    case 'qr_code':
      return 'QRCODE';
    case 'barcode':
      return 'BARCODE';
    default:
      return 'TEXT';
  }
}

// ─── Source Context Options (for QR Code / Barcode fields) ─────────────────────

export const QR_CODE_SOURCE_OPTIONS = [
  { value: 'student_id',          label: 'Student ID' },
  { value: 'employee_id',         label: 'Employee ID' },
  { value: 'url',                 label: 'URL' },
] as const;

export type QrCodeSourceValue = (typeof QR_CODE_SOURCE_OPTIONS)[number]['value'] | string;

export function resolveCodeValue(
  sourceField: string | undefined,
  recordData: any,
  type: 'qr' | 'barcode'
): string {
  // Helper to extract value from recordData
  const getValue = (key: string): string | null | undefined => {
    if (!recordData) return null;
    
    // Check rowData if present (Excel import)
    if (recordData.rowData) {
      if (recordData.rowData[key] != null) return String(recordData.rowData[key]);
      
      // Case-insensitive lookup in rowData
      const foundKey = Object.keys(recordData.rowData).find(
        (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === key.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      if (foundKey && recordData.rowData[foundKey] != null) return String(recordData.rowData[foundKey]);
    }
    
    // Direct properties
    if (recordData[key] != null && typeof recordData[key] !== 'object') {
      return String(recordData[key]);
    }
    if (recordData.data && recordData.data[key] != null) {
      return String(recordData.data[key]);
    }
    if (recordData.custom_fields && recordData.custom_fields[key] != null) {
      return String(recordData.custom_fields[key]);
    }
    
    // Case-insensitive lookup on direct object
    const foundDirectKey = Object.keys(recordData).find(
      (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === key.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    if (foundDirectKey && recordData[foundDirectKey] != null && typeof recordData[foundDirectKey] !== 'object') {
      return String(recordData[foundDirectKey]);
    }
    if (recordData.data) {
      const foundDataKey = Object.keys(recordData.data).find(
        (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === key.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      if (foundDataKey && recordData.data[foundDataKey] != null) {
        return String(recordData.data[foundDataKey]);
      }
    }
    if (recordData.custom_fields) {
      const foundCfKey = Object.keys(recordData.custom_fields).find(
        (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === key.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      if (foundCfKey && recordData.custom_fields[foundCfKey] != null) {
        return String(recordData.custom_fields[foundCfKey]);
      }
    }
    return null;
  };

  if (!sourceField || sourceField.startsWith('el_') || sourceField === 'identifier') {
    const idVal = getValue('identifier_value') || getValue('student_id') || getValue('employee_id') || getValue('identifier');
    if (idVal) return idVal;
    return type === 'qr' ? 'QR_PLACEHOLDER' : '123456789';
  }

  // Special system / computed values:
  if (sourceField === 'url') {
    const idVal = getValue('identifier_value') || getValue('student_id') || getValue('employee_id') || getValue('id') || '12345';
    return getVerificationUrl(idVal);
  }

  // Look up source field value
  const val = getValue(sourceField);
  if (val !== null && val != null) {
    return val;
  }

  // Fallbacks for compatibility mapping or standard fields if key not directly found
  if (sourceField === 'student_id' || sourceField === 'employee_id') {
    return getValue('identifier_value') || getValue('student_id') || getValue('employee_id') || '123456789';
  }

  return sourceField;
}

// ─── Field ID helpers ──────────────────────────────────────────────────────────

export function labelToFieldId(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

// ─── Default Field Specs ───────────────────────────────────────────────────────

const DEFAULT_FIELD_SPECS: Array<{ label: string; type: string; category: string; required?: boolean; source_context?: string }> = [
  // Photo
  { label: 'Profile Image', type: 'image', category: 'Photo' },

  // Personal Information
  { label: 'Full Name', type: 'text', required: true, category: 'Personal Information' },
  { label: 'First Name', type: 'text', category: 'Personal Information' },
  { label: 'Last Name', type: 'text', category: 'Personal Information' },
  { label: 'Date of Birth', type: 'text', category: 'Personal Information' },
  { label: 'Gender', type: 'text', category: 'Personal Information' },
  { label: 'Blood Group', type: 'text', category: 'Personal Information' },
  { label: 'Nationality', type: 'text', category: 'Personal Information' },

  // Contact Information
  { label: 'Phone Number', type: 'text', category: 'Contact Information' },
  { label: 'Mobile Number', type: 'text', category: 'Contact Information' },
  { label: 'Email Address', type: 'text', category: 'Contact Information' },
  { label: 'Address', type: 'text', category: 'Contact Information' },
  { label: 'City', type: 'text', category: 'Contact Information' },
  { label: 'State', type: 'text', category: 'Contact Information' },
  { label: 'Country', type: 'text', category: 'Contact Information' },
  { label: 'PIN Code', type: 'text', category: 'Contact Information' },

  // Organization Information
  { label: 'Organization Name', type: 'text', category: 'Organization Information' },
  { label: 'Department', type: 'text', category: 'Organization Information' },
  { label: 'Branch', type: 'text', category: 'Organization Information' },
  { label: 'Division', type: 'text', category: 'Organization Information' },
  { label: 'Class', type: 'text', category: 'Organization Information' },
  { label: 'Section', type: 'text', category: 'Organization Information' },
  { label: 'Designation', type: 'text', category: 'Organization Information' },
  { label: 'Academic Year', type: 'text', category: 'Organization Information' },
  { label: 'Joining Date', type: 'text', category: 'Organization Information' },
  { label: 'Expiry Date', type: 'text', category: 'Organization Information' },

  // Emergency Information
  { label: 'Parent Name', type: 'text', category: 'Emergency Information' },
  { label: 'Guardian Name', type: 'text', category: 'Emergency Information' },
  { label: 'Parent Phone', type: 'text', category: 'Emergency Information' },
  { label: 'Emergency Contact', type: 'text', category: 'Emergency Information' },
];

export function createDefaultTemplateFields(identifierType?: string): TemplateFieldDefinition[] {
  const usedIds = new Set<string>();
  
  // Decide the label for the ID field based on the provided identifier type
  let idLabel = 'Student ID';
  let idType = 'student_id';
  if (identifierType === 'employee_id') {
    idLabel = 'Employee ID';
    idType = 'employee_id';
  } else if (identifierType && identifierType !== 'student_id' && identifierType !== 'id') {
    idLabel = identifierType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    idType = identifierType;
  }

  // Insert the context-specific ID field after Full Name (index 2)
  const specs = [...DEFAULT_FIELD_SPECS];
  specs.splice(2, 0, { label: idLabel, type: 'text', required: true, category: 'Personal Information' });

  return specs.map((spec) => {
    let id = labelToFieldId(spec.label);
    if (spec.label === idLabel) {
       id = idType; // Force exact field id for the main identifier
    }
    if (usedIds.has(id)) {
      id = `${id}_${usedIds.size}`;
    }
    usedIds.add(id);
    return {
      id,
      label: spec.label,
      type: spec.type,
      required: spec.required ?? false,
      visible: true,
      placeholder: '',
      source_context: spec.source_context,
      category: spec.category,
    };
  });
}

export function createEmptyTemplateField(label = 'Custom Field'): TemplateFieldDefinition {
  const baseId = labelToFieldId(label) || 'custom_field';
  return {
    id: `${baseId}_${Date.now().toString(36)}`,
    label,
    type: 'text',
    required: false,
    visible: true,
    placeholder: '',
  };
}

export function duplicateTemplateField(field: TemplateFieldDefinition): TemplateFieldDefinition {
  const copyLabel = `${field.label} Copy`;
  return {
    ...field,
    id: `${labelToFieldId(field.label)}_copy_${Date.now().toString(36)}`,
    label: copyLabel,
    source_context: field.source_field || field.source_context || '',
    source_field: field.source_field || field.source_context || '',
  };
}

// ─── API Normalization ─────────────────────────────────────────────────────────

export function normalizeApiFields(raw: unknown[], fallbackToDefaults = false, identifierType?: string): TemplateFieldDefinition[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return fallbackToDefaults ? createDefaultTemplateFields(identifierType) : [];
  }
  const normalized = raw
    .map((item: any) => {
      const id = item?.id || item?.field_key || item?.key;
      const label = item?.label || item?.field_label;
      if (!id || !label) return null;
      let finalId = String(id);
      let finalLabel = String(label);

      // Auto-migrate generic ID fields to the dynamic identifier
      if (finalId.toLowerCase() === 'id' || finalId.toLowerCase() === 'uid' || finalId.toLowerCase() === 'uuid' || finalLabel.toLowerCase() === 'id' || finalLabel.toLowerCase() === 'unique identifier' || finalLabel.toLowerCase() === 'uuid') {
        if (identifierType === 'employee_id') {
          finalId = 'employee_id';
          finalLabel = 'Employee ID';
        } else if (identifierType) {
          finalId = identifierType;
          finalLabel = identifierType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        } else {
          finalId = 'student_id';
          finalLabel = 'Student ID';
        }
      }

      return {
        id: finalId,
        label: finalLabel,
        type: item?.type || item?.field_type || 'text',
        required: Boolean(item?.required ?? item?.is_required),
        visible: item?.visible !== false && item?.visibility !== false,
        placeholder: item?.placeholder || '',
        default_value: item?.default_value ?? null,
        validation_rules: item?.validation_rules || {},
        options: Array.isArray(item?.options) ? item.options : [],
        source_context: item?.source_field || item?.source_context || '',
        source_field: item?.source_field || item?.source_context || '',
        enable_qr: Boolean(item?.enable_qr),
        enable_barcode: Boolean(item?.enable_barcode),
        conditional_rules: Array.isArray(item?.conditional_rules) ? item.conditional_rules : [],
      } satisfies TemplateFieldDefinition;
    })
    .filter(Boolean) as TemplateFieldDefinition[];

  return normalized.length > 0 ? normalized : (fallbackToDefaults ? createDefaultTemplateFields(identifierType) : []);
}

/**
 * Maps field types to their API-expected storage type.
 *
 * IMPORTANT: qr_code and barcode must NEVER be mapped to 'text'.
 * They are distinct auto-generator types that must be preserved as-is
 * so the canvas and print pipeline can render them correctly.
 */
export function mapFieldTypeToApi(type: string): string {
  const map: Record<string, string> = {
    dropdown: 'select',
    textarea:  'text',
    checkbox:  'boolean',
    radio:     'select',
    photo:     'image',
    // qr_code and barcode intentionally NOT remapped — they must stay as-is
  };
  return map[type] || type;
}

// ─── Template JSON Payload Builder ─────────────────────────────────────────────

export function buildTemplateJsonPayload(
  templateName: string,
  fields: TemplateFieldDefinition[],
  options?: {
    front_design?: Record<string, unknown>;
    back_design?: Record<string, unknown>;
    dimensions?: Record<string, unknown>;
  }
) {
  const schema: any = {
    type: 'object',
    title: templateName,
    properties: {},
    required: []
  };

  const uiSchema: any = {};

  fields.forEach(f => {
    const property: any = { type: 'string', title: f.label };
    if (f.default_value) {
      property.default = f.default_value;
    }

    if (f.type === 'number') property.type = 'number';
    else if (f.type === 'checkbox') property.type = 'boolean';
    else if (f.type === 'date') property.format = 'date';
    else if (f.type === 'email') property.format = 'email';
    else if (f.type === 'dropdown' || f.type === 'radio') {
      if (f.options && f.options.length > 0) {
        property.enum = f.options;
      }
    }
    else if (isMediaField(f.type)) {
      property.format = 'uri';
    }

    schema.properties[f.id] = property;
    if (f.required) {
      schema.required.push(f.id);
    }

    const uiOpts: any = {
      'ui:widget': f.type,
      'ui:placeholder': f.placeholder || '',
      'ui:options': {}
    };
    if (f.visible === false) {
      uiOpts['ui:widget'] = 'hidden';
    }
    if (f.source_context || f.source_field) {
      uiOpts['ui:options'].source_context = f.source_field || f.source_context;
    }
    if (f.enable_qr) uiOpts['ui:options'].enable_qr = true;
    if (f.enable_barcode) uiOpts['ui:options'].enable_barcode = true;
    if (f.category) uiOpts['ui:options'].category = f.category;

    uiSchema[f.id] = uiOpts;
  });

  return {
    template_name: templateName,
    template_dimensions: options?.dimensions && (options.dimensions as any).width ? `${(options.dimensions as any).width}x${(options.dimensions as any).height}${(options.dimensions as any).unit || 'mm'}` : '85x55mm',
    schema,
    uiSchema,
    fields: fields.map((f) => ({
      field_id: f.id,
      label: f.label,
      type: f.type,
      required: f.required,
      visible: f.visible,
      placeholder: f.placeholder || '',
      default_value: f.default_value ?? null,
      validation_rules: f.validation_rules || {},
      options: f.options || [],
      source_context: f.source_field || f.source_context || '',
      source_field: f.source_field || f.source_context || '',
      enable_qr: f.enable_qr || false,
      enable_barcode: f.enable_barcode || false,
      conditional_rules: f.conditional_rules || [],
    })),
    front_design: options?.front_design || {},
    back_design: options?.back_design || {},
    ...(options?.dimensions ? { dimensions: options.dimensions } : {}),
  };
}
