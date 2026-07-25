import * as XLSX from "xlsx";

export const getFieldKey = (field: any): string | null => {
  if (!field) return null;
  if (typeof field === 'string') return field;
  const key = field.name ?? field.key ?? field.slug ?? field.field_name ?? field.id ?? field.field_id ?? field.field_key ?? null;
  return key !== null ? String(key) : null;
};

export const getFieldLabel = (field: any): string => {
  if (!field) return "Unnamed Field";
  if (typeof field === 'string') return field;
  const label = field.label ?? field.title ?? field.display_name ?? field.name ?? field.key ?? field.field_label ?? field.field_id ?? field.id ?? "Unnamed Field";
  return String(label);
};

export const normalizeTemplateFields = (fields: any[]): any[] => {
  const seen = new Set<string>();

  return fields
    .filter((field) => {
      if (field.is_deleted === true) return false;
      if (field.is_active === false) return false;
      if (field.hidden === true) return false;
      if (field.is_hidden === true) return false;
      if (field.is_system === true) return false;
      if (field.visible === false) return false;
      if (field.is_visible === false) return false;
      if (field.is_visible === 'false') return false;
      if (field.is_visible === 0) return false;

      const key = getFieldKey(field) || getFieldLabel(field);
      return Boolean(key);
    })
    .filter((field) => {
      const key = getFieldKey(field) || getFieldLabel(field);

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort(
      (a, b) =>
        Number(a.order ?? a.position ?? 0) -
        Number(b.order ?? b.position ?? 0)
    );
};

export const formatExcelValue = (
  value: unknown,
  field: any
): string | number => {
  if (value === null || value === undefined || value === "") return "";

  if (field.type === "date") {
    const dateStr = String(value);
    if (dateStr.includes("T")) {
      return dateStr.split("T")[0];
    }
    return dateStr;
  }

  if (field.type === "boolean" || field.type === "checkbox") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return value as string | number;
};

export const exportRecordsToExcel = (
  records: any[],
  rawTemplateFields: any[]
) => {
  let templateFields = rawTemplateFields;
  if (typeof templateFields === 'string') {
    try {
      templateFields = JSON.parse(templateFields);
    } catch {
      templateFields = [];
    }
  }

  if (!Array.isArray(templateFields) || templateFields.length === 0) {
    throw new Error("Template fields are not available.");
  }

  if (!records || records.length === 0) {
    throw new Error("Record data is not available.");
  }

  const systemFields = [
    "id", "uuid", "created_at", "updated_at", "deleted_at", "created_by", 
    "updated_by", "organization_id", "group_id", "subgroup_id", "template_id", 
    "permissions", "metadata"
  ];

  const activeFields = templateFields.filter((f) => {
    if (f.is_deleted === true) return false;
    if (f.is_active === false) return false;
    if (f.hidden === true) return false;
    if (f.is_hidden === true) return false;
    if (f.is_system === true) return false;

    const isVisible = f.is_visible !== false && f.enabled !== false && !f.deleted && f.is_visible !== 'false' && f.is_visible !== 0;
    if (!isVisible) return false;

    const key = getFieldKey(f);
    if (!key || systemFields.includes(key.toLowerCase())) return false;

    return true;
  });

  let fieldsToUse = activeFields.length > 0 ? activeFields : templateFields.filter(f => {
    const key = getFieldKey(f);
    return key && !systemFields.includes(key.toLowerCase());
  });

  if (fieldsToUse.length === 0) {
    fieldsToUse = templateFields.filter(f => getFieldLabel(f) !== "Unnamed Field");
  }

  if (fieldsToUse.length === 0) {
    throw new Error("No exportable fields are available.");
  }

  const sortedFields = [...fieldsToUse].sort(
    (a, b) => Number(a.order ?? a.position ?? 0) - Number(b.order ?? b.position ?? 0)
  );

  const excelRows = records.map((recordData) => {
    const customData = recordData.custom_data || recordData.data || {};
    return sortedFields.reduce<Record<string, unknown>>((row, field) => {
      const label = getFieldLabel(field);
      const key = getFieldKey(field) || label;
      
      if (!key && !label) return row;

      const value = recordData[key] ?? customData[key] ?? recordData.field_values?.[key] ?? recordData[label] ?? customData[label];

      row[label] = formatExcelValue(value, field);
      return row;
    }, {});
  });

  const validRows = excelRows.filter((row) => Object.keys(row).length > 0);

  if (validRows.length === 0) {
    throw new Error("No exportable data available for the records.");
  }

  const headers = sortedFields.map((f) => getFieldLabel(f));
  const worksheet = XLSX.utils.json_to_sheet(validRows, { header: headers });

  worksheet["!cols"] = headers.map((header) => ({
    wch: Math.max(header.length + 4, 18),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Record Data");

  let fileName = "Records_Export.xlsx";
  if (records.length === 1) {
    const rec = records[0];
    const recName = rec.employee_id ?? rec.student_id ?? rec.full_name ?? rec.name ?? rec.id ?? "Export";
    fileName = `Record_${String(recName).replace(/[^a-zA-Z0-9_-]/g, "_")}.xlsx`;
  } else {
    fileName = `Records_Export_${Date.now()}.xlsx`;
  }

  XLSX.writeFile(workbook, fileName);
};

export const exportTemplateToExcel = (
  rawTemplateFields: any,
  templateName?: string
) => {
  let templateFields = rawTemplateFields;
  if (typeof templateFields === 'string') {
    try {
      templateFields = JSON.parse(templateFields);
    } catch {
      templateFields = [];
    }
  }

  if (!Array.isArray(templateFields) || templateFields.length === 0) {
    throw new Error("No template fields available for export (Empty array passed).");
  }

  const systemFields = [
    "id", "uuid", "created_at", "updated_at", "deleted_at", "created_by", 
    "updated_by", "organization_id", "group_id", "subgroup_id", "template_id", 
    "permissions", "metadata"
  ];

  const activeFields = templateFields.filter((f) => {
    // Exclude hidden, inactive, deleted fields
    const isVisible = f.is_visible !== false && f.enabled !== false && !f.deleted && !f.hidden && f.is_visible !== 'false' && f.is_visible !== 0;
    if (!isVisible) return false;

    const key = getFieldKey(f);
    // Exclude system fields
    if (!key || systemFields.includes(key.toLowerCase())) return false;

    return true;
  });

  const fieldsToUse = activeFields.length > 0 ? activeFields : templateFields;

  if (fieldsToUse.length === 0) {
    throw new Error("No template fields available for export (All fields filtered out).");
  }

  const sortedFields = [...fieldsToUse].sort(
    (a, b) => (a.order ?? a.position ?? 0) - (b.order ?? b.position ?? 0)
  );

  const headers = sortedFields.map((f) => getFieldLabel(f));
  
  // We want ONLY the header row. json_to_sheet with an empty array doesn't generate headers by itself unless we do something special,
  // or we can pass an array with a single empty object to create the header row, then delete the data row, or use aoa_to_sheet.
  // The easiest way is to use aoa_to_sheet (array of arrays):
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);

  worksheet["!cols"] = headers.map((header) => ({
    wch: Math.max(header.length + 4, 18),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

  const name = templateName ? String(templateName).replace(/[^a-zA-Z0-9_-]/g, "_") : "Employee";
  const fileName = `${name}_Template.xlsx`;

  XLSX.writeFile(workbook, fileName);
};
