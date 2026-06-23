/**
 * parseSubscriberFile
 * ────────────────────
 * Parses a spreadsheet (.xlsx / .xls / .csv) of subscribers into normalized
 * { name, phone, email } records.
 *
 * The parser is intentionally header-agnostic and column-order-agnostic. The
 * source spreadsheets fans send are inconsistent — sometimes there's a header
 * row, sometimes not; sometimes the columns are Name/Phone/Email, sometimes
 * reordered. Rather than trust positions, we classify each cell in a row:
 *   - the cell that looks like an email  → email
 *   - a remaining cell with enough digits → phone
 *   - a remaining cell with letters       → name
 * A row with no recognizable email is skipped (this also discards header rows).
 *
 * SheetJS is loaded on demand so it stays out of the main bundle.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cellToString = (cell) => (cell == null ? '' : String(cell).trim());

const countDigits = (value) => (value.match(/\d/g) || []).length;

const hasLetters = (value) => /[a-zA-Z]/.test(value);

/**
 * Classify a single row (array of cell values) into a subscriber record.
 * Returns null when the row has no usable email address.
 */
const classifyRow = (cells) => {
  const values = cells.map(cellToString).filter(Boolean);

  const emailCell = values.find((v) => EMAIL_RE.test(v));
  if (!emailCell) return null;

  const remaining = values.filter((v) => v !== emailCell);

  // A phone cell has 7+ digits (handles "(905) 376-9757", "905-376-9757", etc.)
  const phoneCell = remaining.find((v) => countDigits(v) >= 7);

  // Name is the first leftover cell with letters that isn't the phone cell.
  const nameCell = remaining.find((v) => v !== phoneCell && hasLetters(v));

  return {
    name: nameCell || '',
    phone: phoneCell || '',
    email: emailCell.toLowerCase(),
  };
};

/**
 * Parse a File object into normalized subscriber records.
 *
 * @param {File} file - the uploaded .xlsx/.xls/.csv file
 * @returns {Promise<{ subscribers: Array<{name,phone,email}>, stats: object }>}
 */
export async function parseSubscriberFile(file) {
  if (!file) {
    throw new Error('No file provided.');
  }

  // Load SheetJS lazily — only paid for when an admin actually imports a file.
  const mod = await import('xlsx');
  const XLSX = mod && mod.read ? mod : mod.default;
  if (!XLSX || typeof XLSX.read !== 'function') {
    throw new Error('Spreadsheet parser failed to load.');
  }

  let workbook;
  try {
    const data = await file.arrayBuffer();
    workbook = XLSX.read(data, { type: 'array' });
  } catch (error) {
    throw new Error('Could not read that file. Please upload a valid .xlsx or .csv.');
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The file has no sheets.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    blankrows: false,
    raw: false, // formatted strings — keeps phone formatting intact
    defval: '',
  });

  const seen = new Set();
  const subscribers = [];
  let duplicatesInFile = 0;

  rows.forEach((row) => {
    const record = classifyRow(Array.isArray(row) ? row : [row]);
    if (!record) return;
    if (seen.has(record.email)) {
      duplicatesInFile += 1;
      return;
    }
    seen.add(record.email);
    subscribers.push(record);
  });

  return {
    subscribers,
    stats: {
      totalRows: rows.length,
      withEmail: subscribers.length + duplicatesInFile,
      duplicatesInFile,
      skipped: rows.length - (subscribers.length + duplicatesInFile),
    },
  };
}

export default parseSubscriberFile;
