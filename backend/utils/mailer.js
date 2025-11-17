const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 
 @param {string} to 
 @param {string} subject 
 @param {string} htmlContent 
 @param {string} [clientUrl] 
 */
const sendNotificationEmail = async (to, subject, htmlContent, clientUrl) => {
    
    const baseUrl = clientUrl || process.env.CLIENT_URL || 'http://localhost:5173'; 

    const updatedHtmlContent = htmlContent.replace(/http:\/\/localhost:\d+/g, baseUrl);


    const footerHtml = `
        <div style="font-size: 10px; color: #999; margin-top: 20px; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
            Được gửi bởi TopCV Builder | 84 DUONG SO 30 P6 QUAN GO VAP | HO CHI MINH, 71400 VNM
            <br>
            Nếu bạn nhận được email này do nhầm lẫn, vui lòng bỏ qua.
        </div>
    `;
    
    const fullHtmlContent = updatedHtmlContent + footerHtml; 


    const msg = {
        from: `"TopCV Builder - Thông Báo Mới" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: fullHtmlContent, 
    };

    try {
        await sgMail.send(msg);
        console.log(`✅ Đã gửi email thông báo thành công tới: ${to} (qua SendGrid)`);
        return true;
    } catch (error) {
        console.error(`❌ Lỗi gửi email tới ${to} (qua SendGrid):`);
        
        if (error.response) {
            console.error(error.response.body);
        } else {
            console.error(error.message);
        }
        
        return false;
    }
};

module.exports = { sendNotificationEmail };