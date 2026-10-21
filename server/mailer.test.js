import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ticketEmail, sendTicketEmail } from './mailer.js';
import { EVENT } from '../src/utils/event.js';

const participant = {
  ticketId: 'NATAL-UG-1234-0001',
  fullName: '<a href="https://jahat.example">Klik di sini</a>',
  npm: '12340001',
  email: 'peserta@example.com',
  whatsapp: '081234567890',
  region: 'depok',
  mentorName: '-',
  faculty: 'Informatika',
};

test('the ticket email carries the ticket and event, and participant input cannot add HTML', () => {
  const { subject, text, html } = ticketEmail(participant);
  assert.ok(subject.includes(participant.ticketId));
  assert.ok(text.includes(participant.ticketId) && html.includes(participant.ticketId));
  assert.ok(html.includes(EVENT.venue) && text.includes(EVENT.date));
  assert.ok(!html.includes('<a href'), 'name must be escaped');
  assert.ok(html.includes('&#60;a href'));
});

test('without SMTP settings nothing is sent, and it does not throw', async () => {
  delete process.env.SMTP_USER;
  assert.equal(await sendTicketEmail(participant), false);
});
