const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
    },
});

/**
 * Hàm gửi email chung
 * @param {string} to - Địa chỉ email người nhận
 * @param {string} subject - Chủ đề email
 * @param {string} htmlContent - Nội dung email (HTML)
 */
const sendNotificationEmail = async (to, subject, htmlContent) => {
    const mailOptions = {
        from: `"TopCV Builder - Thông Báo Mới" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: htmlContent,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Đã gửi email thông báo thành công tới: ${to}`);
        return true;
    } catch (error) {
        console.error(`❌ Lỗi gửi email tới ${to}:`, error.message);
        return false;
    }
};

module.exports = { sendNotificationEmail };