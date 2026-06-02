import nodemailer from 'nodemailer';

// Reusable transporter object
let transporter;

async function initTransporter() {
  if (transporter) return transporter;

  // For production, use actual SMTP credentials from .env
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate test SMTP service account from ethereal.email for local development
    // Only created once per server start if no SMTP config is provided
    console.log('No SMTP config found. Generating ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  }
  
  return transporter;
}

export async function sendPasswordResetEmail(toEmail, resetUrl) {
  try {
    const t = await initTransporter();
    
    const mailOptions = {
      from: '"ApplyBuddy Support" <support@applybuddy.com>', // sender address
      to: toEmail, // list of receivers
      subject: 'Password Reset Request - ApplyBuddy', // Subject line
      text: `You requested a password reset for ApplyBuddy. Please click the following link to reset your password: ${resetUrl}\n\nIf you did not request this, please ignore this email.`, // plain text body
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>We received a request to reset your password for your ApplyBuddy account.</p>
          <p>Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; margin: 20px 0; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <hr style="border: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `, // html body
    };

    const info = await t.sendMail(mailOptions);
    
    console.log('Message sent: %s', info.messageId);
    
    // Preview only available when sending through an Ethereal account
    if (info.messageId && !process.env.SMTP_HOST) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}
