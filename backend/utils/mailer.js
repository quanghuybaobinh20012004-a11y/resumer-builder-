// Thay thế thư viện nodemailer bằng thư viện chính thức của SendGrid
const sgMail = require('@sendgrid/mail');

// 1. LẤY API KEY TỪ BIẾN MÔI TRƯỜNG MỚI (SENDGRID_API_KEY)
// BIẾN MÔI TRƯỜNG NÀY PHẢI ĐƯỢC THÊM VÀO RENDER DASHBOARD
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Hàm gửi email chung sử dụng SendGrid API
 * @param {string} to - Địa chỉ email người nhận
 * @param {string} subject - Chủ đề email
 * @param {string} htmlContent - Nội dung email (HTML)
 */
const sendNotificationEmail = async (to, subject, htmlContent) => {
    // Lưu ý: process.env.EMAIL_USER phải là email đã được xác minh trên SendGrid
    const msg = {
        from: `"TopCV Builder - Thông Báo Mới" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: htmlContent,
    };

    try {
        // Thay thế transporter.sendMail bằng sgMail.send
        await sgMail.send(msg);
        console.log(`✅ Đã gửi email thông báo thành công tới: ${to} (qua SendGrid)`);
        return true;
    } catch (error) {
        // In ra chi tiết lỗi từ SendGrid API
        console.error(`❌ Lỗi gửi email tới ${to} (qua SendGrid):`);
        
        // Kiểm tra lỗi chi tiết từ Response của SendGrid (Nếu có)
        if (error.response) {
            console.error(error.response.body);
        } else {
            console.error(error.message);
        }
        
        return false;
    }
};

module.exports = { sendNotificationEmail };