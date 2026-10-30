export interface ConnectionMomentCalendarEvent {
  title: string;
  startLocal: string;
  durationMinutes: number;
  description: string;
  location?: string;
  uidSeed: string;
}

/** Escape caregiver- and recommendation-authored text for an iCalendar value. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatLocalDate(date: Date): string {
  const two = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${two(date.getMonth() + 1)}${two(date.getDate())}T${two(
    date.getHours()
  )}${two(date.getMinutes())}00`;
}

function formatUtcDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function safeUidPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'moment';
}

/**
 * Build a standards-friendly, browser-local ICS calendar file. DTSTART and
 * DTEND are deliberately floating local times so the receiving calendar uses
 * the caregiver's own timezone rather than silently moving the appointment.
 */
export function buildConnectionMomentIcs(event: ConnectionMomentCalendarEvent): string {
  const start = new Date(event.startLocal);
  if (Number.isNaN(start.getTime())) throw new Error('Choose a valid date and time.');
  if (!Number.isFinite(event.durationMinutes) || event.durationMinutes <= 0) {
    throw new Error('Choose a valid duration.');
  }
  const end = new Date(start.getTime() + event.durationMinutes * 60_000);
  const uid = `${safeUidPart(event.uidSeed)}-${formatLocalDate(start)}@kinship.local`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kinship//Shared Connection Moment//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatUtcDate(new Date())}`,
    `DTSTART:${formatLocalDate(start)}`,
    `DTEND:${formatLocalDate(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    ...(event.location ? [`LOCATION:${escapeIcsText(event.location)}`] : []),
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.join('\r\n')}\r\n`;
}

export function defaultCalendarStart(now = new Date()): string {
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setSeconds(0, 0);
  next.setMinutes(Math.ceil(next.getMinutes() / 30) * 30);
  const two = (value: number) => String(value).padStart(2, '0');
  return `${next.getFullYear()}-${two(next.getMonth() + 1)}-${two(next.getDate())}T${two(
    next.getHours()
  )}:${two(next.getMinutes())}`;
}
