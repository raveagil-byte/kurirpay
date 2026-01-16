import nodemailer from 'nodemailer';

const createTransporter = async () => {
    // Check if real SMTP config exists
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // Fallback to Ethereal (Dev mode)
    console.log("Using Ethereal Mail for development...");
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });

    return transporter;
};

export const sendResetEmail = async (email: string, token: string) => {
    try {
        const transporter = await createTransporter();
        const appUrl = process.env.APP_URL || 'http://localhost:5173';
        const resetUrl = `${appUrl}/#/reset-password?token=${token}`;

        const info = await transporter.sendMail({
            from: '"KurirPay Support" <support@kurirpay.com>',
            to: email,
            subject: 'Reset Password - KurirPay',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Permintaan Reset Password</h2>
                    <p>Halo,</p>
                    <p>Kami menerima permintaan untuk mereset password akun KurirPay Anda.</p>
                    <p>Silakan klik tombol di bawah untuk melanjutkan:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password Saya</a>
                    </div>
                    <p>Atau salin link ini ke browser anda:</p>
                    <p>${resetUrl}</p>
                    <p>Link ini berlaku selama 1 jam.</p>
                    <hr/>
                    <p style="font-size: 12px; color: #666;">Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini.</p>
                </div>
            `
        });

        console.log("Email sent: %s", info.messageId);

        // If using Ethereal, log the preview URL
        if (info.messageId && !process.env.SMTP_HOST) {
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }

        return true;
    } catch (error) {
        console.error("Email send failed:", error);
        return false;
    }
};
