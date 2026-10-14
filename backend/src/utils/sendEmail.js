const nodemailer = require('nodemailer');

/**
 * sendEmail
 * ---------
 * Transports email using Nodemailer and SMTP credentials from environment variables.
 *
 * @param {object} options
 * @param {string} options.to      - Recipient email address
 * @param {string} options.subject - Subject line
 * @param {string} options.html    - HTML email body content
 * @returns {Promise<object>}      - Nodemailer send result
 */
const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: parseInt(process.env.SMTP_PORT, 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = sendEmail;
