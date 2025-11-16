import React, { useState, useEffect } from 'react';
import apiService from '../apiService';
import { useNavigate, Link } from 'react-router-dom';

function DashboardPage() {
  const [cvName, setCvName] = useState('');
  const [myCVs, setMyCVs] = useState([]); // Dòng 9: Đã đúng
  const [user, setUser] = useState({ fullName: 'Người dùng', avatar: '' });
  const [loading, setLoading] = useState(true);
  
  const [shareModal, setShareModal] = useState({ isOpen: false, link: '' });
  const navigate = useNavigate();
  
  const [comparisonMode, setComparisonMode] = useState(false);
  const [cvsToCompare, setCvsToCompare] = useState([]);

  const handleToggleComparison = () => {
    setComparisonMode(prev => {
        if (prev) setCvsToCompare([]); 
        return !prev;
    });
  };

  const handleSelectForComparison = (e, cvId) => {
    e.preventDefault(); e.stopPropagation();
    if (cvsToCompare.includes(cvId)) {
        setCvsToCompare(cvsToCompare.filter(id => id !== cvId));
    } else if (cvsToCompare.length < 2) {
        setCvsToCompare([...cvsToCompare, cvId]);
    } else {
        alert("Chỉ có thể chọn tối đa 2 CV để so sánh.");
    }
  };

  const NOTIFICATION_KEY = 'v1_new_feature_dismissed';
  const [showNotification, setShowNotification] = useState(false);
  
  useEffect(() => {
    if (localStorage.getItem(NOTIFICATION_KEY) !== 'true') {
        setShowNotification(true);
    }
  }, []);
  
  const handleDismissNotification = () => {
      localStorage.setItem(NOTIFICATION_KEY, 'true');
      setShowNotification(false);
  };

  const fetchInitialData = async () => {
    try {
      const cvRes = await apiService.get('/cvs');
      
      // --- SỬA LỖI (1/2): KIỂM TRA TRƯỚC KHI SET ---
      // Chỉ set state nếu API trả về LÀ MỘT MẢNG
      if (Array.isArray(cvRes.data)) {
        setMyCVs(cvRes.data);
      } else {
        // Nếu API trả về lỗi (object, null, v.v...), set một mảng rỗng
        setMyCVs([]);
      }
      
      const userRes = await apiService.get('/user/me');
      setUser(userRes.data);
      
      setLoading(false);
    } catch (error) {
      console.error("Lỗi tải dữ liệu", error);
      setMyCVs([]); // Quan trọng: Set mảng rỗng nếu API sập
      setLoading(false);
    }
  };





  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleCreateCV = async () => {
    if (!cvName.trim()) return alert('Vui lòng nhập tên CV');
    try {
      const response = await apiService.post('/cvs', { cvName: cvName });
      navigate(`/editor/${response.data.cv._id}`);
    } catch (error) {
      alert(`Lỗi: ${error.response?.data?.message}`);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleShare = async (e, cv) => {
    e.preventDefault(); e.stopPropagation();
    try {
      const response = await apiService.put(`/cvs/${cv._id}/toggle-share`);
      fetchInitialData(); 
      if (response.data.isPublic) {
        setShareModal({ 
            isOpen: true, 
            link: `${window.location.origin}/view/${response.data.shareLink}` 
        });
      }
    } catch (error) {
      alert("Lỗi share: " + error.message);
    }
  };
  
  const handleDuplicate = async (e, cvId) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await apiService.post(`/cvs/${cvId}/duplicate`);
      fetchInitialData();
    } catch (error) {
        alert("Lỗi nhân bản: " + error.message);
    }
  };
  
  const handleDelete = async (e, cvId) => {
    e.preventDefault(); e.stopPropagation();
    if (window.confirm("Bạn chắc chắn muốn xóa CV này chứ?")) {
      try {
        await apiService.delete(`/cvs/${cvId}`);
        setMyCVs(myCVs.filter(cv => cv._id !== cvId));
      } catch (error) {
        alert("Lỗi xóa: " + error.message);
      }
    }
  };

  const ShareModal = () => {
    if (!shareModal.isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up">
          <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
             <i className="fas fa-globe text-green-600"></i> Chia sẻ CV công khai
          </h3>
          <div className="bg-gray-100 p-3 rounded border flex justify-between items-center mb-4">
              <span className="truncate text-sm text-gray-600 w-full mr-2">{shareModal.link}</span>
              <button 
                onClick={() => {navigator.clipboard.writeText(shareModal.link); alert("Đã copy!")}}
                className="text-green-600 font-bold text-sm hover:underline"
              >
                  COPY
              </button>
          </div>
          <div className="flex justify-end">
            <button onClick={() => setShareModal({ isOpen: false, link: '' })} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900">Đóng</button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <ShareModal />
      
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-600 rounded text-white flex items-center justify-center font-bold text-lg">T</div>
                <h1 className="text-xl font-bold text-green-600 tracking-tight">TopCV Builder</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition">
                 <img src={user.avatar || "https://via.placeholder.com/40"} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-gray-300"/>
                 <span className="text-sm font-medium hidden sm:block">{user.fullName || "Người dùng"}</span>
              </Link>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition">
                <i className="fas fa-sign-out-alt text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {showNotification && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl mb-6 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                    <i className="fas fa-bullhorn text-xl"></i>
                    <p className="font-medium text-sm">
                        🎉 **TÍNH NĂNG MỚI:** Chế độ Khách (Guest Mode) đã được thêm vào! Bạn có thể tạo CV tạm thời mà không cần đăng nhập.
                    </p>
                </div>
                <button onClick={handleDismissNotification} className="text-blue-500 hover:text-blue-700 font-bold ml-4">
                    <i className="fas fa-times"></i>
                </button>
            </div>
        )}
        
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 shadow-lg text-white mb-10 relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">Chào {user.fullName}, bắt đầu sự nghiệp ngay!</h2>
                <p className="text-green-100 mb-6 max-w-2xl">Tạo một CV chuyên nghiệp chỉ trong vài phút với công cụ hỗ trợ AI của chúng tôi.</p>
                
                <div className="flex flex-col sm:flex-row gap-3 max-w-xl bg-white p-2 rounded-xl shadow-lg">
                    <input 
                        type="text" 
                        placeholder="Đặt tên cho CV mới (VD: CV Marketing 2025)..."
                        value={cvName}
                        onChange={(e) => setCvName(e.target.value)}
                        className="flex-1 p-3 text-gray-800 outline-none rounded-lg"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCV()}
                    />
                    <button 
                        onClick={handleCreateCV}
                        className="px-6 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-plus"></i> Tạo Mới
                    </button>
                </div>
            </div>
            <i className="fas fa-file-alt absolute -right-10 -bottom-10 text-9xl text-white opacity-10 rotate-12"></i>
        </div>

        <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-gray-800">CV Của Tôi <span className="text-sm font-normal text-gray-500 ml-2">({Array.isArray(myCVs) ? myCVs.length : 0} bản ghi)</span></h2>
            
            <div className="flex items-center gap-3">
                {cvsToCompare.length > 0 && (
                    <button 
                        onClick={() => navigate(`/compare/${cvsToCompare[0]}/${cvsToCompare[1]}`)}
                        disabled={cvsToCompare.length !== 2}
                        className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${cvsToCompare.length === 2 ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                    >
                        <i className="fas fa-exchange-alt"></i> So sánh ({cvsToCompare.length}/2)
                    </button>
                )}
                <button 
                    onClick={handleToggleComparison}
                    className={`px-4 py-2 border rounded-lg font-bold transition-all flex items-center gap-2 ${comparisonMode ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                >
                    <i className={`fas ${comparisonMode ? 'fa-times' : 'fa-list-ol'}`}></i> 
                    {comparisonMode ? 'Hủy So sánh' : 'Chế độ So sánh'}
                </button>
            </div>
        </div>

        {/* --- SỬA LỖI (2/2): "RÀO CHẮN" TRƯỚC KHI MAP --- */}
        {Array.isArray(myCVs) && myCVs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCVs.map(cv => (
                <div 
                    key={cv._id} 
                    onClick={comparisonMode ? (e) => handleSelectForComparison(e, cv._id) : null}
                    className={`group bg-white rounded-xl shadow-sm border transition-all duration-300 flex flex-col overflow-hidden 
                                ${comparisonMode ? 'cursor-pointer hover:border-indigo-400' : 'hover:shadow-xl border-gray-200'}
                                ${cvsToCompare.includes(cv._id) ? 'border-4 border-indigo-500 ring-2 ring-indigo-300' : 'border-gray-200'}`
                    }
                >
                  
                  <Link 
                    to={`/editor/${cv._id}`} 
                    className={`h-48 bg-gray-100 relative overflow-hidden transition ${comparisonMode ? 'pointer-events-none opacity-80' : 'cursor-pointer group-hover:opacity-90'}`}
                  >
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                          <i className="fas fa-file-contract text-6xl"></i>
                      </div>
                      {cv.isPublic && (
                          <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                              Public
                          </span>
                      )}
                      <div className={`absolute inset-0 bg-black bg-opacity-0 flex items-center justify-center transition 
                                      ${comparisonMode ? 'opacity-100 bg-opacity-20' : 'group-hover:bg-opacity-10'}`}
                      >
                          <span className={`${comparisonMode ? 'bg-white text-indigo-700 font-bold py-1 px-3 rounded-full text-sm' : 'opacity-0 group-hover:opacity-100 bg-white text-gray-900 font-bold py-2 px-4 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition'}`}>
                              {comparisonMode ? (cvsToCompare.includes(cv._id) ? 'Đã chọn' : 'Chọn') : 'Chỉnh sửa'}
                          </span>
                      </div>
                  </Link>
                  
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <Link 
                            to={`/editor/${cv._id}`} 
                            className={`font-bold text-lg text-gray-800 hover:text-green-600 truncate flex-1 mr-2 ${comparisonMode ? 'pointer-events-none' : ''}`} 
                            title={cv.cvName}
                        >
                            {cv.cvName}
                        </Link>
                        <div className="relative">
                        </div>
                    </div>
                    
                    <p className="text-xs text-gray-400 mb-4">
                        Cập nhật: {new Date(cv.updatedAt).toLocaleDateString('vi-VN')}
                    </p>

                    <div className="mt-auto flex justify-between items-center border-t pt-4">
                        <button 
                            onClick={(e) => handleShare(e, cv)}
                            className={`text-sm flex items-center gap-1 ${cv.isPublic ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-600'}`}
                            title="Chia sẻ"
                            disabled={comparisonMode}
                        >
                            <i className="fas fa-share-alt"></i> {cv.isPublic ? 'Đã Bật' : 'Chia sẻ'}
                        </button>

                        <div className="flex gap-3">
                            <button 
                                onClick={(e) => handleDuplicate(e, cv._id)}
                                className={`text-gray-400 hover:text-gray-700 transition ${comparisonMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Nhân bản"
                                disabled={comparisonMode}
                            >
                                <i className="fas fa-copy"></i>
                            </button>
                            <button 
                                onClick={(e) => handleDelete(e, cv._id)}
                                className={`text-gray-400 hover:text-red-500 transition ${comparisonMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Xóa"
                                disabled={comparisonMode}
                            >
                                <i className="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="text-gray-300 mb-4 text-6xl"><i className="fas fa-folder-open"></i></div>
                <h3 className="text-xl font-medium text-gray-600">Chưa có CV nào</h3>
                <p className="text-gray-400 mb-6">Hãy tạo CV đầu tiên để bắt đầu hành trình sự nghiệp.</p>
                <button onClick={() => document.querySelector('input').focus()} className="text-green-600 font-bold hover:underline">
                    Tạo ngay &rarr;
                </button>
            </div>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;