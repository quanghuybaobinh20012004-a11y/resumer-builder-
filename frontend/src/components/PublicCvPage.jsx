import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../apiService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function PublicCvPage() {
  const { shareLink } = useParams();
  const [cvData, setCvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const previewRef = useRef(null);

  useEffect(() => {
    const fetchPublicCv = async () => {
      try {
        const response = await apiService.get(`/public/${shareLink}`);
        setCvData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Không tìm thấy CV hoặc CV đã bị khóa.");
        setLoading(false);
      }
    };
    fetchPublicCv();
  }, [shareLink]);

  const handleDownloadPDF = async () => {
    const input = previewRef.current;
    if (!input) return;
    const originalShadow = input.style.boxShadow;
    input.style.boxShadow = 'none';

    try {
      const canvas = await html2canvas(input, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save('cv-download.pdf');
    } catch (err) {
      alert("Lỗi tải PDF");
    } finally {
      input.style.boxShadow = originalShadow;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-green-600 font-bold">Đang tải dữ liệu CV...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold bg-gray-100">{error}</div>;
  if (!cvData) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 font-sans">
      
      <div className="bg-white px-6 py-3 rounded-full shadow-lg mb-6 flex items-center gap-4 sticky top-5 z-50">
         <span className="font-bold text-gray-700">CV của {cvData.personalInfo?.fullName || 'Ứng viên'}</span>
         <div className="h-6 w-px bg-gray-300"></div>
         <button 
            onClick={handleDownloadPDF}
            className="text-topcv-primary font-bold hover:text-green-700 flex items-center gap-2"
         >
            <i className="fas fa-download"></i> Tải PDF
         </button>
      </div>

      <div id="cv-preview-sheet" ref={previewRef}>
        <div className="cv-header">
          <div className="cv-avatar-box">
             {cvData.personalInfo?.avatar ? (
                <img src={cvData.personalInfo.avatar} alt="Avatar" className="cv-avatar-img" crossOrigin="anonymous"/>
             ) : (
                <span className="text-gray-300 text-4xl"><i className="fas fa-user"></i></span>
             )}
          </div>
          <div className="cv-header-info">
            <h1 className="cv-name">{cvData.personalInfo?.fullName}</h1>
            <p className="cv-position">{cvData.personalInfo?.position}</p>
          </div>
          <div className="cv-contact">
             <div>{cvData.personalInfo?.dob}</div>
             <div>{cvData.personalInfo?.phone}</div>
             <div>{cvData.personalInfo?.email}</div>
             <div>{cvData.personalInfo?.address}</div>
          </div>
        </div>

        <div className="cv-body">
          <div className="cv-col-left">
             {cvData.education?.length > 0 && (
               <div className="cv-section">
                 <div className="cv-section-title">Học vấn</div>
                 {cvData.education.map((edu, i) => (
                   <div key={i} className="cv-timeline-item">
                     <div className="cv-time-box">
                       <span>{edu.startDate}</span>
                       <span className="text-xs font-normal">đến</span>
                       <span>{edu.endDate}</span>
                     </div>
                     <div className="cv-content-box">
                       <div className="cv-item-title">{edu.school}</div>
                       <div className="cv-item-sub">{edu.degree}</div>
                     </div>
                   </div>
                 ))}
               </div>
             )}

             {cvData.experience?.length > 0 && (
               <div className="cv-section">
                 <div className="cv-section-title">Kinh nghiệm làm việc</div>
                 {cvData.experience.map((exp, i) => (
                   <div key={i} className="cv-timeline-item">
                     <div className="cv-time-box">
                        <span>{exp.startDate}</span>
                        <span className="text-xs font-normal">đến</span>
                        <span>{exp.endDate}</span>
                     </div>
                     <div className="cv-content-box">
                       <div className="cv-item-title">{exp.company}</div>
                       <div className="cv-item-sub">{exp.position}</div>
                       <div className="cv-item-desc" dangerouslySetInnerHTML={{__html: (exp.description || '').replace(/\n/g, '<br/>').replace(/- /g, '• ')}}></div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>

          <div className="cv-col-right">
            {cvData.personalInfo?.summary && (
                <div className="cv-section">
                <div className="cv-section-title">Mục tiêu nghề nghiệp</div>
                <div className="cv-summary-text">{cvData.personalInfo.summary}</div>
                </div>
            )}

            {cvData.skills?.length > 0 && (
                <div className="cv-section">
                <div className="cv-section-title">Kỹ năng</div>
                {cvData.skills.map((skill, i) => (
                    <div key={i} className="cv-skill-item">
                    <div className="cv-skill-name">{typeof skill === 'string' ? skill : skill.value}</div>
                    <div className="cv-skill-bg">
                        <div className="cv-skill-fill" style={{width: '75%'}}></div>
                    </div>
                    </div>
                ))}
                </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 text-gray-500 text-sm">
        Được tạo bởi <span className="font-bold text-green-600">TopCV Builder</span>
      </div>
    </div>
  );
}

export default PublicCvPage;