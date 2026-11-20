import QRCode from 'qrcode';
import { EVENT, MEETING_POINTS } from './event';
import { regionName } from './regions';

// The issued e-ticket drawn on a canvas and saved as JPG. It mirrors TicketCard in RegistrationSection.jsx:
// change both together.
const W = 460; // card width in CSS pixels; drawn at 2x for a sharp image
const PAD = 24;
const MARGIN = 20; // page colour around the card: a JPG has no transparency for the rounded corners
const SCALE = 2;
const QR_SIZE = 132; // check-in QR, beside the date/time/place box
const SANS = '"Plus Jakarta Sans", system-ui, sans-serif';
const MONO = 'ui-monospace, Menlo, Consolas, monospace';
const GOLD = '#f7d660';
const LABEL = '#a3aba1';
const TEXT = '#e5e3d8';
const BORDER = 'rgba(243, 196, 48, 0.3)';

function text(ctx, value, x, y, font, color, spacing = '0px') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.letterSpacing = spacing;
  ctx.fillText(value, x, y);
  ctx.letterSpacing = '0px';
}

// Cut to maxWidth with an ellipsis, like CSS `truncate`
function fit(ctx, value, maxWidth, font) {
  ctx.font = font;
  if (ctx.measureText(value).width <= maxWidth) return value;
  while (value && ctx.measureText(`${value}…`).width > maxWidth) value = value.slice(0, -1);
  return `${value}…`;
}

function wrap(ctx, value, maxWidth, font) {
  ctx.font = font;
  const lines = [];
  let line = '';
  for (const word of value.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  return [...lines, line];
}

// The site's four-point star
function star(ctx, cx, cy, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i - Math.PI / 2;
    const len = i % 2 ? r * 0.37 : r;
    ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// Draws the card H pixels tall and returns where its content ends
function drawTicket(ctx, p, qr, H) {
  const inner = W - PAD * 2;
  const col = (inner - 12) / 2;

  // Card: pine to maroon, palette ribbon on top, faint star watermark, gold border
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 16);
  ctx.clip();
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1a4d3e');
  bg.addColorStop(0.5, '#0f2e25');
  bg.addColorStop(1, '#5c1515');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ['#7a1c1c', '#1a4d3e', '#4e8774', '#f3c430'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect((W / 4) * i, 0, W / 4, 6);
  });
  ctx.globalAlpha = 0.1;
  star(ctx, W - 48, H - 48, 96, GOLD);
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.beginPath();
  ctx.roundRect(0.5, 0.5, W - 1, H - 1, 16);
  ctx.strokeStyle = BORDER;
  ctx.stroke();

  // Header
  let y = PAD;
  text(ctx, 'PERSEKUTUAN DOA UNIVERSITAS GUNADARMA', PAD, y + 10, `600 10px ${SANS}`, GOLD, '2.5px');
  ctx.font = '700 24px Cinzel';
  const gold = ctx.createLinearGradient(PAD, 0, PAD + ctx.measureText('NATAL 2026').width + 12, 0);
  [['#fff8dc', 0], ['#f7d660', 0.3], ['#f3c430', 0.6], ['#fff1b8', 0.85], ['#d9a614', 1]].forEach(([c, s]) =>
    gold.addColorStop(s, c)
  );
  text(ctx, 'NATAL 2026', PAD, y + 42, '700 24px Cinzel', gold, '1.2px');
  text(ctx, `“${EVENT.theme}” — ${EVENT.verseRef}`, PAD, y + 60, 'italic 400 13px "Cormorant Garamond"', 'rgba(253, 241, 198, 0.8)');
  ctx.beginPath();
  ctx.arc(W - PAD - 22, y + 22, 22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(243, 196, 48, 0.1)';
  ctx.fill();
  ctx.strokeStyle = BORDER;
  ctx.stroke();
  star(ctx, W - PAD - 22, y + 22, 10, GOLD);
  y += 66 + 16;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(PAD, y, inner, 1);
  y += 1 + 16;

  // Participant fields
  const field = (label, value, x, width, font, color) => {
    text(ctx, label.toUpperCase(), x, y + 10, `400 10px ${SANS}`, LABEL, '1px');
    text(ctx, fit(ctx, value || '-', width, font), x, y + 27, font, color);
  };
  field('Nama Lengkap', p.fullName, PAD, inner, `600 14px ${SANS}`, '#ffffff');
  y += 34;
  const rows = [
    ['Jenis Kelamin', p.gender, GOLD, 'Region', regionName(p.region), TEXT],
    ['Status', p.status, TEXT, 'WhatsApp', p.whatsapp, TEXT],
    ['Kakak Komsel', p.mentorName, TEXT, 'Jurusan', p.faculty, TEXT],
    ['Keberangkatan', p.departure, '#8cc7b1', 'Area Keberangkatan', p.departureArea, TEXT],
  ];
  for (const [l1, v1, c1, l2, v2, c2] of rows) {
    y += 12;
    field(l1, v1, PAD, col, `500 12px ${SANS}`, c1);
    field(l2, v2, PAD + col + 12, col, l2 === 'WhatsApp' ? `400 12px ${MONO}` : `500 12px ${SANS}`, c2);
    y += 30;
  }

  const meeting = MEETING_POINTS[p.departureArea];
  if (meeting) {
    y += 12;
    const lead = 'Titik kumpul: ';
    const meetingLines = wrap(ctx, lead + meeting, inner, `400 10px ${SANS}`);
    meetingLines.forEach((line, i) => {
      const yy = y + 10 + i * 13;
      if (i === 0) {
        text(ctx, lead, PAD, yy, `600 10px ${SANS}`, GOLD);
        text(ctx, line.slice(lead.length), PAD + ctx.measureText(lead).width, yy, `400 10px ${SANS}`, TEXT);
      } else text(ctx, line, PAD, yy, `400 10px ${SANS}`, TEXT);
    });
    y += meetingLines.length * 13;
  }

  // Date, time and place, with the check-in QR beside them
  y += 20;
  const boxW = inner - QR_SIZE - 12;
  const lines = [EVENT.date, EVENT.time, ...wrap(ctx, EVENT.venue, boxW - 42, `400 12px ${SANS}`)];
  const boxH = Math.max(QR_SIZE, 24 + lines.length * 24);
  ctx.beginPath();
  ctx.roundRect(PAD, y, boxW, boxH, 12);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.stroke();
  const first = y + (boxH - lines.length * 24) / 2 + 16; // lines centred in the box
  lines.forEach((line, i) => {
    if (i < 3) star(ctx, PAD + 18, first + i * 24 - 4, 5, GOLD);
    text(ctx, line, PAD + 30, first + i * 24, `400 12px ${SANS}`, TEXT);
  });
  const qrY = y + (boxH - QR_SIZE) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(W - PAD - QR_SIZE, qrY, QR_SIZE, QR_SIZE, 10);
  ctx.clip();
  ctx.drawImage(qr, W - PAD - QR_SIZE, qrY, QR_SIZE, QR_SIZE);
  ctx.restore();
  y += boxH + 16;

  // Ticket code
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += 14;
  text(ctx, 'KODE TIKET RESMI', PAD, y + 9, `400 9px ${SANS}`, GOLD, '1.8px');
  text(ctx, p.ticketId, PAD, y + 28, `700 14px ${MONO}`, GOLD);
  return y + 32;
}

export async function ticketJpgBlob(p) {
  // The page's web fonts; the canvas only uses them once loaded
  await Promise.all(
    ['700 24px Cinzel', 'italic 400 13px "Cormorant Garamond"', `600 14px ${SANS}`, `400 11px ${SANS}`].map((f) =>
      document.fonts.load(f)
    )
  );
  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, p.ticketId, { margin: 2, width: QR_SIZE * SCALE });

  // Lay out once to learn the height, then draw for real
  const H = drawTicket(document.createElement('canvas').getContext('2d'), p, qr, 2000) + PAD;
  const canvas = document.createElement('canvas');
  canvas.width = (W + MARGIN * 2) * SCALE;
  canvas.height = (H + MARGIN * 2) * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = '#06140f';
  ctx.fillRect(0, 0, W + MARGIN * 2, H + MARGIN * 2);
  ctx.translate(MARGIN, MARGIN);
  drawTicket(ctx, p, qr, H);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Gambar tiket gagal dibuat'))), 'image/jpeg', 0.92)
  );
}

// Saves the ticket as Tiket-<code>.jpg
export async function downloadTicketJpg(p) {
  const url = URL.createObjectURL(await ticketJpgBlob(p));
  const a = document.createElement('a');
  a.href = url;
  a.download = `Tiket-${p.ticketId}.jpg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
