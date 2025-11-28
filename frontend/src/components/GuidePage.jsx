import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../apiService'; 

const GuideSection = ({ title, children, className = "" }) => (
  <div className={`bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 mb-8 ${className}`}>
    <h2 className="text-2xl font-bold text-green-700 mb-4 pb-3 border-b border-gray-200">{title}</h2>
    <div className="space-y-4 text-gray-700 leading-relaxed">
      {children}
    </div>
  </div>
);

function GuidePage() {
  const [industryInput, setIndustryInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Thêm trạng thái loading
  const navigate = useNavigate();

  const handleStartAssist = async () => { // Thêm async để gọi API
    const trimmedInput = industryInput.trim();
    if (trimmedInput.length < 3) {
      setError('Vui lòng nhập tên ngành nghề hoặc vị trí cụ thể (ít nhất 3 ký tự).');
      return;
    }
    setError('');

    const isAuthenticated = localStorage.getItem('token');
    
    if (isAuthenticated) {
        // --- TRƯỜNG HỢP ĐÃ ĐĂNG NHẬP ---
        setLoading(true);
        try {
            // 1. Tạo CV mới trong Database
            const res = await apiService.post('/cvs', { 
                cvName: `CV ${trimmedInput} (AI Gợi ý)` 
            });
            const newCvId = res.data.cv._id;
            
            // 2. Chuyển hướng đến trang Editor với ID thật
            navigate(`/editor/${newCvId}?industry=${encodeURIComponent(trimmedInput)}`);
        } catch (err) {
            console.error(err);
            setError("Lỗi khi tạo CV mới. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    } else {
        // --- TRƯỜNG HỢP KHÁCH (GUEST) ---
        navigate(`/editor/new?industry=${encodeURIComponent(trimmedInput)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      <header className="bg-white shadow-sm h-16 flex items-center px-6 sticky top-0 z-30 border-b">
         <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
             <Link to="/dashboard" className="text-gray-500 hover:text-green-600 font-medium flex items-center gap-2 transition-colors">
                <i className="fas fa-arrow-left"></i> Quay lại Dashboard
             </Link>
             <h1 className="font-bold text-xl text-green-600 flex items-center gap-2">
                <i className="fas fa-robot"></i> AI Gợi ý Nội dung CV theo Ngành
             </h1>
         </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        
        <GuideSection title="Nhập Ngành Nghề hoặc Vị trí Ứng tuyển">
            <p className="text-lg text-gray-700 mb-4">Nhập vị trí bạn đang ứng tuyển (ví dụ: "Kỹ sư phần mềm 3 năm kinh nghiệm" hoặc "Thực tập sinh Marketing") để nhận gợi ý nội dung AI.</p>
            
            <div className="flex flex-col md:flex-row gap-3">
                <input 
                    type="text"
                    value={industryInput}
                    onChange={(e) => setIndustryInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartAssist()}
                    placeholder="VD: Data Analyst 2 năm kinh nghiệm"
                    disabled={loading}
                    className={`flex-1 p-4 border rounded-xl shadow-inner outline-none transition-colors ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-green-500'}`}
                />
                <button 
                    onClick={handleStartAssist}
                    disabled={loading}
                    className={`px-6 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                >
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                    {loading ? 'Đang tạo...' : 'Bắt đầu với AI'}
                </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-500 font-medium"><i className="fas fa-exclamation-triangle mr-1"></i> {error}</p>}
        </GuideSection>

        <GuideSection title="Quy tắc chung để CV Chuyên nghiệp">
             <ul className="list-disc list-inside space-y-2 pl-4">
                <li>**Định lượng (Quantify):** Luôn dùng con số (tăng trưởng 20%, quản lý team 5 người) trong phần Kinh nghiệm.</li>
                <li>**Từ khóa (Keywords):** Đảm bảo CV chứa các từ khóa kỹ thuật từ mô tả công việc (Job Description) bạn đang ứng tuyển.</li>
                <li>**Độ dài:** CV chỉ nên dài **1 trang A4** (tối đa 2 trang nếu trên 10 năm kinh nghiệm).</li>
                <li>**Sử dụng AI:** Dùng tính năng **CV Score** để kiểm tra mức độ hiệu quả của CV.</li>
            </ul>
        </GuideSection>
      </main>
    </div>
  );
}

export default GuidePage;