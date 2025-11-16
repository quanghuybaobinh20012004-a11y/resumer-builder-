const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const CV = require('../models/cv.model');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(400).json({ message: 'Không tìm thấy người dùng.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { fullName, phone, address, avatar } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, phone, address, avatar },
      { new: true }
    ).select('-password');

    res.json({ message: 'Cập nhật hồ sơ thành công!', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});


router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập mật khẩu cũ và mới.' });
    }

    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu cũ không chính xác.' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công!' });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});


router.delete('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    await CV.deleteMany({ userId: userId });
    await User.findByIdAndDelete(userId);
    res.json({ message: 'Tài khoản và tất cả dữ liệu CV đã được xóa vĩnh viễn.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

module.exports = router;