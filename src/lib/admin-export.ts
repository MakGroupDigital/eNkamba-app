export function formatExportValue(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  const maybeDate = value as { toDate?: () => Date };
  if (typeof maybeDate.toDate === 'function') {
    const date = maybeDate.toDate();
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function escapeCsvCell(value: unknown) {
  const text = formatExportValue(value).replace(/\r?\n/g, ' ');
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return '';

  const headers = Array.from(
    rows.reduce((keys, row) => {
      Object.keys(row).forEach((key) => keys.add(key));
      return keys;
    }, new Set<string>()),
  );

  return [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(',')),
  ].join('\n');
}

export function downloadTextFile(filename: string, content: string, type = 'text/plain;charset=utf-8') {
  if (typeof document === 'undefined') return;

  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  downloadTextFile(filename, toCsv(rows), 'text/csv;charset=utf-8');
}
