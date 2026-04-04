const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendWelcomeEmail = async ({ email, fullName, matricNumber, password, role }) => {
  const roleLabel = role === 'lecturer' ? 'Lecturer' : 'Student';

  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Welcome to CS-Vault — Your Login Details',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #0f0f0f; color: #f0f0f0; border-radius: 12px;">
          <h2 style="color: #C8F135; margin-bottom: 4px;">CS-Vault</h2>
          <p style="color: #888; font-size: 13px; margin-top: 0;">School Project Repository</p>
          <hr style="border-color: #222; margin: 24px 0;" />
          <p>Hi <strong>${fullName}</strong>,</p>
          <p>Your <strong>${roleLabel}</strong> account has been created on CS-Vault.</p>
          <p>Here are your login details:</p>
          <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0;"><span style="color: #888;">Login ID:</span> <strong>${matricNumber}</strong></p>
            <p style="margin: 4px 0;"><span style="color: #888;">Password:</span> <strong style="color: #C8F135;">${password}</strong></p>
          </div>
          <p style="color: #f87171; font-size: 13px;">⚠️ Please change your password after your first login.</p>
          <a href="${process.env.FRONTEND_URL}/login"
            style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #C8F135; color: #000; font-weight: bold; border-radius: 8px; text-decoration: none;">
            Login to CS-Vault
          </a>
          <p style="margin-top: 32px; font-size: 12px; color: #555;">If you did not expect this email, please ignore it.</p>
        </div>
      `,
    });
    console.log(`✅ Email sent to ${email}`);
  } catch (err) {
    // Email failure is logged but never crashes the request
    console.error(`❌ Email failed for ${email}:`, err.message);
  }
};

module.exports = { sendWelcomeEmail };