/**
 * One CSV cell, safe to open in Excel or Sheets.
 *
 * Quoted so commas and quotes survive, and prefixed with ' when it starts like
 * a formula — subscriber fields come from the public signup form, and a value
 * such as =HYPERLINK(...) would otherwise run when the export is opened.
 */
export const csvCell = (value) => {
  const text = String(value ?? '');
  const neutralized = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${neutralized.replace(/"/g, '""')}"`;
};

/** Joins rows of raw values into CSV text under a header line. */
export const toCsvText = (header, rows) =>
  [header.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))].join('\n');
