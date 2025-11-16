const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken'); 
const passport = require('passport');
const { sendNotificationEmail } = require('../utils/mailer'); 
const crypto = require('crypto');

// (Tất cả các route /register, /login, /forgot-password, /reset-password của bạn đều đúng, giữ nguyên)
// ...
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu.' });
    }
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email này đã được sử dụng.' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      email: email,
      password: hashedPassword,
      fullName: fullName || '',
    });
    await newUser.save();
    res.status(201).json({ message: 'Tạo tài khoản thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Có lỗi xảy ra', error: error.message });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }
    const payload = {
      user: {
        id: user.id,
        email: user.email
      }
    };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          message: "Đăng nhập thành công!",
          token: token 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Có lỗi xảy ra', error: error.message });
  }
});


router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: 'Nếu tài khoản tồn tại, một mã OTP đã được gửi đến email.' });
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpires = Date.now() + 3600000; // Hết hạn sau 1 giờ

    user.resetPasswordToken = otpCode;
    user.resetPasswordExpires = otpExpires;
    await user.save();

    const subject = "Mã Xác thực Đặt lại Mật khẩu TopCV Builder";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <p>Chào bạn,</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã xác thực (OTP) sau:</p>
            <h2 style="color: #00b14f; font-size: 24px; border: 1px solid #eee; padding: 10px; display: inline-block;">${otpCode}</h2>
            <p>Mã này sẽ hết hạn sau 1 giờ.</p>
            <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
        </div>
    `;

    await sendNotificationEmail(user.email, subject, htmlContent);

    res.json({ message: 'Mã xác thực đã được gửi đến email của bạn.' });

  } catch (error) {
    console.error("Lỗi quên mật khẩu:", error);
    res.status(500).json({ message: 'Lỗi server khi gửi mã xác thực.', error: error.message });
  }
});


router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email, mã OTP và mật khẩu mới.' });
    }
    
    const user = await User.findOne({ 
      email: email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
    }
    
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu mới phải từ 6 ký tự trở lên.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.' });

  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error);
    res.status(500).json({ message: 'Lỗi server khi đặt lại mật khẩu.', error: error.message });
  }
});

// ...

// ----- BẮT ĐẦU SỬA Ở ĐÂY -----

router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// Thêm dòng này để lấy URL của frontend từ biến môi trường
// Khi ở máy: dùng 'http://localhost:5173'
// Khi deploy: dùng 'https://resumebuilder11111.netlify.app'
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: `${clientUrl}/login`, // <-- SỬA TỪ 'http://localhost...'
    session: false 
  }), 
  (req, res) => {
    const payload = {
      user: {
        id: req.user.id,
        email: req.user.email
      }
    };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.redirect(`${clientUrl}/login?token=${token}`); // <-- SỬA TỪ 'http://localhost...'
  }
);
// ----- KẾT THÚC SỬA -----

module.exports = router;