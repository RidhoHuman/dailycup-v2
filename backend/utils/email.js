const nodemailer = require('nodemailer');
const { EMAIL_CONFIG, EMAIL_FROM } = require('../config/constants');

// Create reusable transporter
let transporter = null;

function getTransporter() {
  if (!transporter && EMAIL_CONFIG.auth.user) {
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
  }
  return transporter;
}

// Send email
async function sendEmail(to, subject, html, text = null) {
  try {
    const transport = getTransporter();
    
    if (!transport) {
      console.log('⚠️ Email not configured, skipping email send');
      return { success: false, message: 'Email not configured' };
    }

    const mailOptions = {
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const info = await transport.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { success: false, error: error.message };
  }
}

// Send order completed email
async function sendOrderCompletedEmail(userEmail, userName, orderNumber, orderTotal) {
  const subject = `Pesanan Anda Telah Selesai - ${orderNumber}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4a2c2a; padding: 20px; text-align: center;">
        <h1 style="color: #f5e6d3; margin: 0;">DailyCup</h1>
      </div>
      <div style="padding: 20px; background-color: #ffffff;">
        <h2 style="color: #4a2c2a;">Halo ${userName},</h2>
        <p>Pesanan Anda dengan nomor <strong>${orderNumber}</strong> telah selesai!</p>
        <p>Total pesanan: <strong>Rp ${orderTotal.toLocaleString('id-ID')}</strong></p>
        <p>Terima kasih telah berbelanja di DailyCup. Kami harap Anda menikmati produk kami!</p>
        <p>Silakan berikan rating dan review untuk pesanan Anda.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="color: #666; font-size: 12px;">
            Email ini dikirim otomatis, mohon tidak membalas email ini.
          </p>
        </div>
      </div>
    </div>
  `;
  
  return await sendEmail(userEmail, subject, html);
}

// Send order status update email
async function sendOrderStatusEmail(userEmail, userName, orderNumber, status) {
  const statusText = {
    confirmed: 'Dikonfirmasi',
    processing: 'Sedang Diproses',
    ready: 'Siap Diambil/Dikirim',
    delivering: 'Dalam Pengiriman',
    completed: 'Selesai',
    cancelled: 'Dibatalkan'
  };

  const subject = `Update Pesanan ${orderNumber} - ${statusText[status]}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4a2c2a; padding: 20px; text-align: center;">
        <h1 style="color: #f5e6d3; margin: 0;">DailyCup</h1>
      </div>
      <div style="padding: 20px; background-color: #ffffff;">
        <h2 style="color: #4a2c2a;">Halo ${userName},</h2>
        <p>Status pesanan Anda <strong>${orderNumber}</strong> telah diperbarui menjadi:</p>
        <div style="background-color: #f5e6d3; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h3 style="color: #4a2c2a; margin: 0;">${statusText[status]}</h3>
        </div>
        <p>Terima kasih atas kesabaran Anda!</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="color: #666; font-size: 12px;">
            Email ini dikirim otomatis, mohon tidak membalas email ini.
          </p>
        </div>
      </div>
    </div>
  `;
  
  return await sendEmail(userEmail, subject, html);
}

module.exports = {
  sendEmail,
  sendOrderCompletedEmail,
  sendOrderStatusEmail
};
