const express = require('express');
const router = express.Router();
const CV = require('../models/cv.model');


router.get('/:shareLink', async (req, res) => {
  try {
    const shareLink = req.params.shareLink;

    const cv = await CV.findOne({ 
      shareLink: shareLink,
      isPublic: true 
    });

    if (!cv) {
      return res.status(404).json({ message: 'Không tìm thấy CV này hoặc CV đã bị khóa.' });
    }

    res.json({
      personalInfo: cv.personalInfo,
      experience: cv.experience,
      education: cv.education,
      skills: cv.skills,
      projects: cv.projects,
      certificates: cv.certificates,
      settings: cv.settings
    });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

module.exports = router;