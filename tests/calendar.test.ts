import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildConnectionMomentIcs,
  defaultCalendarStart,
  escapeIcsText,
} from '../src/utils/calendar';

test('calendar text escaping prevents authored copy from breaking ICS fields', () => {
  assert.equal(
    escapeIcsText('Tea, music; then\\quiet\nNo quiz'),
    'Tea\\, music\\; then\\\\quiet\\nNo quiz'
  );
});

test('a connection moment becomes a local-time ICS event with the chosen duration', () => {
  const ics = buildConnectionMomentIcs({
    title: 'Shared time with Vera: Ella Fitzgerald',
    startLocal: '2026-11-05T16:30',
    durationMinutes: 30,
    description: 'Listen together.\nNo need to finish.',
    location: 'Cape Town, South Africa',
    uidSeed: 'ella-fitzgerald',
  });

  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /BEGIN:VEVENT\r\n/);
  assert.match(ics, /DTSTART:20261105T163000\r\n/);
  assert.match(ics, /DTEND:20261105T170000\r\n/);
  assert.match(ics, /SUMMARY:Shared time with Vera: Ella Fitzgerald\r\n/);
  assert.match(ics, /DESCRIPTION:Listen together\.\\nNo need to finish\.\r\n/);
  assert.match(ics, /LOCATION:Cape Town\\, South Africa\r\n/);
  assert.match(ics, /UID:ella-fitzgerald-20261105T163000@kinship\.local/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
});

test('the suggested calendar time is tomorrow on a half-hour boundary', () => {
  assert.equal(defaultCalendarStart(new Date(2026, 9, 30, 14, 7)), '2026-10-31T14:30');
});

test('invalid calendar input is rejected instead of downloading a broken file', () => {
  assert.throws(
    () =>
      buildConnectionMomentIcs({
        title: 'Shared time',
        startLocal: '',
        durationMinutes: 30,
        description: 'Sit together.',
        uidSeed: 'shared-time',
      }),
    /valid date and time/
  );
});
