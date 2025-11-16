const express = require('express');
const router = express.Router();
const { sendNotificationEmail } = require('../utils/mailer');
const User = require('../models/user.model'); 

router.post('/new-template', async (req, res) => {
  try {
    const { subject, templateName, featureDescription } = req.body;

    const users = await User.find({}).select('email -_id');
    const emails = users.map(user => user.email);

    if (emails.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng nào để gửi.' });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7f7f7;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
          <h1 style="color: #00b14f; border-bottom: 2px solid #00b14f; padding-bottom: 10px;">🎉 Có Gì Mới Trên TopCV Builder!</h1>
          <h2 style="color: #333; margin-top: 20px;">${templateName || subject}</h2>
          <p style="color: #555; line-height: 1.6;">Chào bạn,</p>
          <p style="color: #555; line-height: 1.6;">Chúng tôi rất vui thông báo về cập nhật mới nhất:</p>
          <ul style="color: #555; padding-left: 20px;">
            <li><strong>Tính năng mới:</strong> ${featureDescription || 'Một mẫu CV mới tuyệt đẹp đã được thêm vào thư viện!'}</li>
          </ul>
          <a href="http://localhost:5173/dashboard" style="display: inline-block; background-color: #00b14f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
            Tạo CV Ngay
          </a>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.</p>
        </div>
      </div>
    `;

    const sendPromises = emails.map(email => 
        sendNotificationEmail(email, subject, htmlContent)
    );

    await Promise.allSettled(sendPromises);

    res.json({ 
        message: `Đã kích hoạt gửi thông báo tới ${emails.length} người dùng.`, 
        emailsSent: emails.length 
    });

  } catch (error) {
    console.error("Lỗi khi gửi email hàng loạt:", error);
    res.status(500).json({ message: 'Lỗi server khi gửi thông báo.', error: error.message });
  }
});

module.exports = router;