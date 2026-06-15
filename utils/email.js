const nodemailer = require('nodemailer');

function buildTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendTwoFaEmail(to, code) {
  const transport = buildTransport();

  if (!transport) {
    /* No SMTP configured — print to console for local dev */
    console.log(`[2FA] To: ${to}  |  Code: ${code}`);
    return;
  }

  await transport.sendMail({
    from:    process.env.SMTP_FROM || '"Mendez Transportation" <noreply@mendeztransport.com>',
    to,
    subject: 'Your verification code — Mendez Transportation',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <div style="margin-bottom:24px">
          <span style="font-weight:700;color:#1E2A6E;font-size:18px">Mendez Transportation</span>
        </div>
        <p style="color:#374151;margin:0 0 8px">Your one-time verification code is:</p>
        <div style="font-size:40px;font-weight:700;letter-spacing:10px;color:#1E2A6E;padding:16px 0;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;margin:16px 0">
          ${code}
        </div>
        <p style="color:#6b7280;font-size:13px;margin:16px 0 0">
          This code expires in <strong>10 minutes</strong>. Do not share it with anyone.<br>
          If you did not request this, please ignore this email.
        </p>
      </div>
    `
  });
}

module.exports = { sendTwoFaEmail };
