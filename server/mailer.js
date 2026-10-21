import nodemailer from 'nodemailer';
import { regionName } from '../src/utils/regions.js';
import { EVENT } from '../src/utils/event.js';

// Participant input ends up in HTML sent from the panitia's own address: escape it so nobody can inject links
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const label = 'font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#9ca3af';
const field = (name, value, style = 'color:#e5e7eb') =>
  `<td width="50%" valign="top" style="padding:6px 8px 6px 0"><div style="${label}">${name}</div>` +
  `<div style="font-size:13px;word-break:break-word;${style}">${esc(value)}</div></td>`;
const row = (...cells) => `<tr>${cells.join('')}</tr>`;

// Decorative bars, as on the e-ticket card
const BARS = [2, 4, 1, 3, 2, 5, 2, 1, 4, 2, 3, 1, 5, 2, 3, 2];

// The e-ticket card from the site, as table HTML that email apps can show, plus a plain-text copy
export function ticketEmail(r) {
  const subject = `Tiket Natal PD Gunadarma 2026 - ${r.ticketId}`;

  const text = [
    `Shalom, ${r.fullName}!`,
    'Pendaftaran Ibadah & Perayaan Natal PD Gunadarma 2026 Anda sudah terkonfirmasi.',
    '',
    `KODE TIKET: ${r.ticketId}`,
    `Nama Lengkap: ${r.fullName}`,
    `NPM: ${r.npm}`,
    `Region: ${regionName(r.region)}`,
    `Kakak Komsel: ${r.mentorName}`,
    `Jurusan: ${r.faculty}`,
    '',
    `Tanggal: ${EVENT.date}`,
    `Pukul: ${EVENT.time}`,
    `Lokasi: ${EVENT.venue}`,
    '',
    'Tunjukkan kode tiket ini di pintu masuk.',
    'Sampai berjumpa dalam sukacita Natal! Tuhan Yesus memberkati.',
    '',
    'Panitia Natal PD Gunadarma 2026',
  ].join('\n');

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0b0b0f">
<div style="background:#0b0b0f;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#d1d5db">
  <p style="max-width:460px;margin:0 auto 16px;font-size:14px;line-height:1.5">
    Shalom, <strong style="color:#ffffff">${esc(r.fullName)}</strong>!<br>
    Pendaftaran Ibadah &amp; Perayaan Natal PD Gunadarma 2026 Anda sudah terkonfirmasi. Ini tiket Anda:
  </p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;margin:0 auto;border-collapse:separate;background:#09152b;background-image:linear-gradient(180deg,#09152b,#051a14 55%,#1a060d);border:1px solid #6b5a2a;border-radius:16px;overflow:hidden">
    <tr><td style="height:6px;line-height:6px;font-size:0;background:#facc15;background-image:linear-gradient(90deg,#fcd34d,#facc15,#f59e0b)">&nbsp;</td></tr>
    <tr><td style="padding:20px 22px 14px;border-bottom:1px solid #1f2a3a">
      <div style="font-size:10px;letter-spacing:3px;color:#fcd34d;font-weight:bold">PERSEKUTUAN DOA UNIVERSITAS GUNADARMA</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:bold;letter-spacing:2px;color:#f5d061;margin-top:2px">NATAL 2026</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:12px;color:#c9b98a">&ldquo;Merayakan Kasih, Menyalakan Harapan&rdquo;</div>
    </td></tr>
    <tr><td style="padding:12px 22px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row(`<td colspan="2" style="padding:6px 0"><div style="${label}">Nama Lengkap</div><div style="font-size:15px;font-weight:bold;color:#ffffff">${esc(r.fullName)}</div></td>`)}
        ${row(field('NPM', r.npm, 'color:#fcd34d;font-family:Consolas,monospace'), field('Region', regionName(r.region)))}
        ${row(field('Email', r.email, 'color:#d1d5db;font-family:Consolas,monospace;font-size:12px'), field('WhatsApp', r.whatsapp, 'color:#d1d5db;font-family:Consolas,monospace;font-size:12px'))}
        ${row(field('Kakak Komsel', r.mentorName), field('Jurusan', r.faculty))}
      </table>
    </td></tr>
    <tr><td style="padding:10px 22px 0">
      <div style="padding:10px 12px;border-radius:12px;background:#05080f;border:1px solid #1a2230;font-size:12px;line-height:1.8;color:#d1d5db">
        &#128197; ${esc(EVENT.date)}<br>&#128339; ${esc(EVENT.time)}<br>&#128205; ${esc(EVENT.venue)}
      </div>
    </td></tr>
    <tr><td style="padding:16px 22px 20px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px dashed #4b5563"><tr>
        <td style="padding-top:12px">
          <div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#fcd34d">Kode Tiket Resmi</div>
          <div style="font-family:Consolas,monospace;font-size:16px;font-weight:bold;color:#fcd34d">${esc(r.ticketId)}</div>
        </td>
        <td align="right" style="padding-top:12px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>${BARS.map(
          (w) => `<td style="width:${w}px;height:28px;background:#fde68a;font-size:0">&nbsp;</td><td style="width:2px;font-size:0">&nbsp;</td>`
        ).join('')}</tr></table></td>
      </tr></table>
    </td></tr>
  </table>
  <p style="max-width:460px;margin:16px auto 0;font-size:13px;line-height:1.5">
    Tunjukkan kode tiket ini di pintu masuk. Sampai berjumpa dalam sukacita Natal! Tuhan Yesus memberkati.<br>
    <span style="color:#9ca3af">Panitia Natal PD Gunadarma 2026</span>
  </p>
</div>
</body></html>`;

  return { subject, text, html };
}

let transport;

// true once the ticket is on its way to the participant; never throws, because the registration is already saved
export async function sendTicketEmail(r) {
  const { SMTP_USER, SMTP_PASS, SMTP_HOST } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return false;

  transport ||= nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port: 587,
    requireTLS: true,
    // Gmail shows app passwords in groups of four
    auth: { user: SMTP_USER, pass: SMTP_PASS.replace(/\s/g, '') },
    // The participant waits for this before seeing the ticket
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
  });

  try {
    await transport.sendMail({
      from: { name: 'Panitia Natal PD Gunadarma 2026', address: SMTP_USER },
      to: { name: r.fullName, address: r.email },
      ...ticketEmail(r),
    });
    return true;
  } catch (err) {
    console.error(`[Email] Ticket ${r.ticketId} not sent:`, err.message);
    return false;
  }
}
