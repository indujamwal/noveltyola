/**
 * Novelty Ola – website enquiries
 * Saves every enquiry from www.noveltyola.com into the "Ola Website Enquires" Google Sheet
 * and emails it straight away.
 *
 * Emails go to the Google account that deploys this script.
 * To also send them to other people, add their addresses below, separated by commas.
 */
const SHEET_ID = 'PASTE-YOUR-GOOGLE-SHEET-ID-HERE';
const SHEET_NAME = 'Sheet1';
const EXTRA_EMAILS = '';   // e.g. 'sales@noveltyola.com, manager@noveltyola.com'

const HEADERS = ['Received', 'Form', 'Name', 'Phone', 'Pincode', 'Product / Model',
                 'Interest', 'Outlet', 'Preferred date', 'Message', 'Page'];

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p['bot-field']) return done_();                    // spam trap filled in: ignore

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = getSheet_();
    const when = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd-MMM-yyyy hh:mm a');
    const form = p['form-name'] === 'popup-enquiry' ? 'Popup' : 'Contact form';
    const row = [
      when, form, p.name || '', "'" + (p.phone || ''), p.pincode || '',
      p.product || p.model || '', p.interest || '', p.outlet || '',
      p.date || '', p.message || '', p.page || ''
    ];
    sheet.appendRow(row);
    try { sendEmail_(row); } catch (err) { console.error('Email failed: ' + err); }
  } finally {
    lock.releaseLock();
  }
  return done_();
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  return sheet;
}

function sendEmail_(row) {
  const to = [Session.getEffectiveUser().getEmail(), EXTRA_EMAILS].filter(String).join(',');
  if (!to) return;
  const name = row[2], phone = String(row[3]).replace("'", ''), outlet = row[7] || 'No outlet chosen';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = HEADERS.map((h, i) => [h, i === 3 ? phone : row[i]])
    .filter(([, v]) => v)
    .map(([h, v]) => `<tr><td style="padding:6px 14px 6px 0;color:#55605A">${h}</td><td style="padding:6px 0"><b>${esc(v)}</b></td></tr>`)
    .join('');
  MailApp.sendEmail({
    to: to,
    subject: `New Ola enquiry – ${name} (${outlet})`,
    name: 'Novelty Ola Website',
    htmlBody: `<div style="font-family:Arial,sans-serif;font-size:14px">
      <h2 style="color:#0B7A3B;margin:0 0 12px">New enquiry from noveltyola.com</h2>
      <table>${lines}</table>
      <p style="margin-top:16px">Call: <a href="tel:+91${phone}">+91 ${phone}</a> &nbsp;·&nbsp;
      WhatsApp: <a href="https://wa.me/91${phone}">wa.me/91${phone}</a></p></div>`
  });
}

function done_() {
  return ContentService.createTextOutput('ok');
}

/** Run this once from the editor: it adds a test row and sends a test email. */
function testEnquiry() {
  doPost({ parameter: {
    'form-name': 'popup-enquiry', name: 'Test Customer', phone: '9876543210',
    pincode: '143001', product: 'Ola S1 X', outlet: 'Amritsar'
  }});
}
