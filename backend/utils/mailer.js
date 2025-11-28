const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER, // vuinhungratbuon113@gmail.com
        pass: process.env.EMAIL_PASS, // ccer htwb zriv wjxh
    },
});

/**
 * Gửi email thông báo
 */
const sendNotificationEmail = async (to, subject, htmlContent, clientUrl) => {
    
    const baseUrl = clientUrl || process.env.CLIENT_URL || 'http://localhost:5173'; 
    const updatedHtmlContent = htmlContent.replace(/http:\/\/localhost:\d+/g, baseUrl);

    const footerHtml = `
       
    `;
    
    const fullHtmlContent = updatedHtmlContent + footerHtml; 

    const mailOptions = {
        from: `"TopCV Builder" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: fullHtmlContent, 
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Đã gửi email thông báo thành công tới: ${to} (qua Gmail SMTP)`);
        return true;
    } catch (error) {
        console.error(`❌ Lỗi gửi email tới ${to} (qua Gmail SMTP):`, error.message);
        return false;
    }
};

module.exports = { sendNotificationEmail };