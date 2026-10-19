const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Indian digit grouping (12,34,567.89) without relying on Intl. */
export function money(value: unknown): string {
  const n = Number(value ?? 0);
  if (!isFinite(n)) {
    return '₹0';
  }
  const negative = n < 0;
  const [whole, fraction] = Math.abs(n).toFixed(2).split('.');
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  return `${negative ? '-' : ''}₹${grouped}${fraction === '00' ? '' : '.' + fraction}`;
}

function parse(value: unknown): Date | null {
  if (!value) {
    return null;
  }
  const s = String(value);
  // Plain dates ("2026-10-18") are calendar days, not UTC midnight.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

const day = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

export function date(value: unknown): string {
  const d = parse(value);
  return d ? day(d) : '—';
}

export function dateTime(value: unknown): string {
  const d = parse(value);
  if (!d) {
    return '—';
  }
  const h = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day(d)} · ${h % 12 || 12}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Today as YYYY-MM-DD in local time. */
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "ready_to_ship" -> "Ready To Ship". */
export function label(value?: string | null): string {
  if (!value) {
    return '—';
  }
  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function stripHtml(value?: string | null): string {
  if (!value) {
    return '';
  }
  return String(value)
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h\d)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function initials(name?: string | null): string {
  if (!name) {
    return '?';
  }
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');
}
