import { TemplateFieldDefinition } from './template-fields';

function normalize(k: string): string {
  return (k || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Format date values. Defaults to 'DD MMM YYYY' if possible.
 */
function formatDateValue(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
  return d.toLocaleDateString('en-GB', options); // 23 Nov 1997
}

/**
 * Resolve a single field key from a record's root or nested data cleanly.
 */
export function resolveFieldValue(key: string, recordData: any): any {
  if (!key || !recordData) return undefined;
  
  // 1. Direct property match
  if (recordData[key] !== undefined && recordData[key] !== null) {
    return recordData[key];
  }

  // 2. Try nested objects commonly used for dynamic templates
  const customData = recordData.custom_data || recordData.custom_fields || recordData.data || {};
  if (customData[key] !== undefined && customData[key] !== null) {
    return customData[key];
  }

  // 3. Fallback to normalized keys (case-insensitive without special chars)
  const nk = normalize(key);
  const directKey = Object.keys(recordData).find(k => normalize(k) === nk && typeof recordData[k] !== 'object');
  if (directKey && recordData[directKey] !== undefined && recordData[directKey] !== null) {
    return recordData[directKey];
  }

  const customKey = Object.keys(customData).find(k => normalize(k) === nk);
  if (customKey && customData[customKey] !== undefined && customData[customKey] !== null) {
    return customData[customKey];
  }

  return undefined;
}

/**
 * Resolve {{token}} or [token] placeholders safely using field keys.
 */
export function resolvePlaceholderTokens(
  text: string,
  recordData: any,
  templateFields: TemplateFieldDefinition[] = []
): string {
  if (!text) return '';
  
  const data = recordData || {};
  const customData = data.custom_data || data.custom_fields || data.data || {};

  // We support {{token}} and [token]
  const regex = /(\{\{([^}]+)\}\})|(\[([^\]]+)\])/g;

  return text.replace(regex, (match, p1, p2, p3, p4) => {
    const rawToken = p2 || p4;
    if (!rawToken) return '';
    const token = rawToken.trim();
    const normalizedToken = normalize(token);

    let resolvedField: TemplateFieldDefinition | undefined;

    // 1. Try to find field by exact key match
    resolvedField = templateFields.find(f => (f as any).name === token || (f as any).key === token || f.id === token || normalize((f as any).name || (f as any).key || f.id || '') === normalizedToken);

    // 2. Try to find field by exact label match
    if (!resolvedField) {
      resolvedField = templateFields.find(f => f.label === token || normalize(f.label || '') === normalizedToken);
    }

    if (resolvedField) {
      const fieldKey = (resolvedField as any).name || (resolvedField as any).key || resolvedField.id || normalize(resolvedField.label);
      
      let val = data[fieldKey];
      if (val === undefined || val === null) {
        val = customData[fieldKey];
      }
      
      // If we found the field in the schema, but the value is missing in JSON:
      if (val === undefined || val === null || val === '') {
        console.warn(`Missing template value for key: ${fieldKey}`);
        return '';
      }

      // Format date if needed
      if (resolvedField.type === 'date') {
        return formatDateValue(String(val));
      }

      return String(val);
    }

    // 3. Fallbacks for system fields if no field is matched
    // (In case the template doesn't explicitly define 'name' but we have a fallback)
    const directKey = Object.keys(data).find(
      k => normalize(k) === normalizedToken && typeof data[k] !== 'object'
    );
    if (directKey && data[directKey] !== undefined && data[directKey] !== null) {
      return String(data[directKey]);
    }

    const customKey = Object.keys(customData).find(k => normalize(k) === normalizedToken);
    if (customKey && customData[customKey] !== undefined && customData[customKey] !== null) {
      return String(customData[customKey]);
    }

    // If completely unknown token and it wasn't matched anywhere:
    // We return empty string instead of exposing [Token]
    return '';
  });
}
