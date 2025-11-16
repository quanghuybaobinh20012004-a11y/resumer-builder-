const express = require('express');
const router = express.Router();
const CV = require('../models/cv.model');
const authMiddleware = require('../middleware/auth.middleware');
const { v4: uuidv4 } = require('uuid');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require('docx');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const cvs = await CV.find({ userId: userId })
                        .select('_id cvName isPublic shareLink updatedAt')
                        .sort({ updatedAt: -1 });
    res.json(cvs);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const cvId = req.params.id;
    const cv = await CV.findById(cvId);
    if (!cv) return res.status(404).json({ message: 'Không tìm thấy CV.' });
    if (cv.userId.toString() !== userId) return res.status(403).json({ message: 'Không có quyền truy cập.' });
    res.json(cv);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cvName } = req.body;
    const newCV = new CV({
      userId: userId,
      cvName: cvName || "CV chưa đặt tên",
      personalInfo: {},
      experience: [],
      education: [],
      projects: [],
      skills: [],
      certificates: [],
      activities: [],
      settings: { color: '#ec8f00', fontFamily: "'Roboto', sans-serif" }
    });
    await newCV.save();
    res.status(201).json({ message: 'Tạo CV mới thành công!', cv: newCV });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const cvId = req.params.id;
    const cvData = req.body;
    
    const cv = await CV.findById(cvId);
    if (!cv) return res.status(404).json({ message: 'Không tìm thấy CV.' });
    if (cv.userId.toString() !== userId) return res.status(403).json({ message: 'Không có quyền.' });

    const updatedCV = await CV.findByIdAndUpdate(cvId, { ...cvData }, { new: true });
    res.json({ message: 'Cập nhật CV thành công!', cv: updatedCV });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const cvId = req.params.id;
        const cv = await CV.findById(cvId);
        if (!cv) return res.status(404).json({ message: 'Không tìm thấy CV.' });
        if (cv.userId.toString() !== userId) return res.status(403).json({ message: 'Không có quyền.' });

        await CV.findByIdAndDelete(cvId);
        res.json({ message: 'Xóa CV thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.put('/:id/toggle-share', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const cvId = req.params.id;
    const cv = await CV.findById(cvId);
    if (!cv) return res.status(404).json({ message: 'Không tìm thấy CV.' });
    if (cv.userId.toString() !== userId) return res.status(403).json({ message: 'Không có quyền.' });

    const newPublicState = !cv.isPublic;
    let newShareLink = cv.shareLink;
    if (newPublicState === true && !cv.shareLink) newShareLink = uuidv4();

    const updatedCV = await CV.findByIdAndUpdate(
      cvId,
      { isPublic: newPublicState, shareLink: newShareLink },
      { new: true }
    );

    res.json({ 
      message: `Đã ${newPublicState ? 'bật' : 'tắt'} chia sẻ.`,
      isPublic: updatedCV.isPublic,
      shareLink: updatedCV.shareLink
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.post('/:id/duplicate', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const cvId = req.params.id;
    const originalCv = await CV.findById(cvId).lean();
    if (!originalCv) return res.status(404).json({ message: 'Không tìm thấy CV.' });
    if (originalCv.userId.toString() !== userId) return res.status(403).json({ message: 'Không có quyền.' });

    const newCvData = { ...originalCv };
    delete newCvData._id; 
    delete newCvData.shareLink; 
    newCvData.isPublic = false; 
    newCvData.cvName = `${originalCv.cvName} (Bản sao)`; 
    newCvData.createdAt = new Date(); 
    newCvData.updatedAt = new Date(); 

    const duplicatedCv = new CV(newCvData);
    await duplicatedCv.save();
    res.status(201).json({ message: 'Nhân bản thành công!', cv: duplicatedCv });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.get('/:id/docx', authMiddleware, async (req, res) => {
  try {
    const cv = await CV.findById(req.params.id);
    if (!cv) return res.status(404).json({ message: 'Không tìm thấy CV' });
    if (cv.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Không có quyền' });

    const children = [];

    children.push(
      new Paragraph({
        text: (cv.personalInfo.fullName || 'Họ Tên').toUpperCase(),
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: (cv.personalInfo.position || 'Vị trí ứng tuyển').toUpperCase(),
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      })
    );

    const contactInfo = [cv.personalInfo.email, cv.personalInfo.phone, cv.personalInfo.address].filter(Boolean).join(" | ");
    if (contactInfo) {
        children.push(new Paragraph({
            text: contactInfo,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        }));
    }

    const createSectionTitle = (text) => new Paragraph({
        text: text.toUpperCase(),
        heading: HeadingLevel.HEADING_1,
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
        spacing: { before: 400, after: 200 },
    });

    if (cv.personalInfo.summary) {
        children.push(createSectionTitle("Mục tiêu nghề nghiệp"));
        children.push(new Paragraph({ text: cv.personalInfo.summary, alignment: AlignmentType.JUSTIFIED }));
    }

    if (cv.experience && cv.experience.length > 0) {
        children.push(createSectionTitle("Kinh nghiệm làm việc"));
        cv.experience.forEach(exp => {
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: exp.company, bold: true, size: 24 }),
                    new TextRun({ text: `  (${exp.startDate} - ${exp.endDate})`, italics: true })
                ],
                spacing: { before: 200 }
            }));
            children.push(new Paragraph({ text: exp.position, bold: true, color: "2E74B5" }));
            if (exp.description) children.push(new Paragraph({ text: exp.description }));
        });
    }

    if (cv.education && cv.education.length > 0) {
        children.push(createSectionTitle("Học vấn"));
        cv.education.forEach(edu => {
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: edu.school, bold: true }),
                    new TextRun({ text: ` - ${edu.degree}` }),
                    new TextRun({ text: ` (${edu.startDate} - ${edu.endDate})`, italics: true })
                ],
                bullet: { level: 0 }
            }));
        });
    }

    if (cv.skills && cv.skills.length > 0) {
        children.push(createSectionTitle("Kỹ năng"));
        const skillText = cv.skills.map(s => typeof s === 'string' ? s : s.value).join(", ");
        children.push(new Paragraph({ text: skillText }));
    }

    const doc = new Document({ sections: [{ properties: {}, children: children }] });
    const buffer = await Packer.toBuffer(doc);
    
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(cv.cvName || 'cv')}.docx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);

  } catch (error) {
    console.error("Lỗi xuất DOCX:", error);
    res.status(500).json({ message: 'Lỗi server khi tạo file DOCX', error: error.message });
  }
});

module.exports = router;