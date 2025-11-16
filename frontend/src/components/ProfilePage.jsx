import React, { useState, useEffect } from 'react';
import apiService from '../apiService';
import { useNavigate, Link } from 'react-router-dom';

function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [profile, setProfile] = useState({
    fullName: '', email: '', phone: '', address: '', avatar: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '', newPassword: '', confirmNewPassword: ''
  });
  
  const [message, setMessage] = useState({ type: '', content: '' });

  
  const showToast = (type, content) => {
    setMessage({ type, content });
    setTimeout(() => setMessage({ type: '', content: '' }), 3000);
  };

  const fetchProfile = async () => {
    try {
      const res = await apiService.get('/user/me');
      setProfile({
        fullName: res.data.fullName || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
        avatar: res.data.avatar || ''
      });
      setLoading(false);
    } catch (err) {
      showToast('error', 'Không thể tải hồ sơ.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileChange = e => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return showToast('error', 'Ảnh quá lớn (Max 2MB)');

    const reader = new FileReader();
    reader.onloadend = () => setProfile(prev => ({ ...prev, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiService.put('/user/me', {
        fullName: profile.fullName,
        phone: profile.phone,
        address: profile.address,
        avatar: profile.avatar
      });
      setProfile(res.data.user);
      localStorage.setItem('userAvatar', res.data.user.avatar || ''); 
      showToast('success', 'Cập nhật hồ sơ thành công!');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Lỗi cập nhật.');
    }
  };

  const handlePasswordChange = e => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
       return showToast('error', 'Mật khẩu xác nhận không khớp.');
    }
    if (passwordData.newPassword.length < 6) {
       return showToast('error', 'Mật khẩu mới phải từ 6 ký tự.');
    }
    try {
      await apiService.put('/user/password', { 
          oldPassword: passwordData.oldPassword, 
          newPassword: passwordData.newPassword 
      });
      showToast('success', 'Đổi mật khẩu thành công!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Mật khẩu cũ không đúng.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn tài khoản và tất cả CV của bạn. Bạn có chắc chắn không?")) return;
    try {
      await apiService.delete('/user/me');
      localStorage.clear();
      navigate('/login');
    } catch (err) {
      showToast('error', 'Lỗi khi xóa tài khoản.');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      
      {message.content && (
        <div className={`fixed top-5 right-5 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 animate-fade-in-down ${message.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>
           <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2`}></i>
           {message.content}
        </div>
      )}

      <header className="bg-white shadow-sm h-16 flex items-center px-6 sticky top-0 z-30">
         <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
             <Link to="/dashboard" className="text-gray-500 hover:text-green-600 font-medium flex items-center gap-2">
                <i className="fas fa-arrow-left"></i> Quay lại Dashboard
             </Link>
             <div className="flex items-center gap-4">
                 <h1 className="font-bold text-xl text-green-600 hidden sm:block">Quản lý hồ sơ</h1>
                 <button 
                   onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} 
                   className="text-gray-400 hover:text-red-600 transition" 
                   title="Đăng xuất"
                 >
                   <i className="fas fa-sign-out-alt text-lg"></i>
                 </button>
             </div>
         </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        
        <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
            <div className="h-40 bg-gradient-to-r from-green-600 to-emerald-500"></div>
            
            <div className="px-8 pb-6 flex flex-col sm:flex-row items-center sm:items-end -mt-12 gap-6">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md">
                         <img src={profile.avatar || "https://via.placeholder.com/150"} alt="Avatar" className="w-full h-full object-cover"/>
                    </div>
                    <label className="absolute bottom-2 right-2 bg-white text-gray-700 p-2 rounded-full shadow-lg cursor-pointer hover:text-green-600 hover:bg-gray-50 transition">
                        <i className="fas fa-camera"></i>
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                </div>

                <div className="flex-1 text-center sm:text-left mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{profile.fullName || "Chưa cập nhật tên"}</h2>
                    <p className="text-gray-500">{profile.email}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b">
                        <i className="fas fa-user-edit text-green-600"></i> Thông tin cá nhân
                    </h3>
                    <form onSubmit={handleProfileSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><i className="fas fa-user"></i></span>
                                    <input 
                                        name="fullName" 
                                        value={profile.fullName} 
                                        onChange={handleProfileChange} 
                                        className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition" 
                                        placeholder="Nhập họ tên" 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><i className="fas fa-phone"></i></span>
                                    <input 
                                        name="phone" 
                                        value={profile.phone} 
                                        onChange={handleProfileChange} 
                                        className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition" 
                                        placeholder="0909..." 
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Email đăng nhập</label>
                             <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><i className="fas fa-envelope"></i></span>
                                <input 
                                    value={profile.email} 
                                    disabled 
                                    className="w-full pl-10 p-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed" 
                                />
                             </div>
                             <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><i className="fas fa-map-marker-alt"></i></span>
                                <input 
                                    name="address" 
                                    value={profile.address} 
                                    onChange={handleProfileChange} 
                                    className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition" 
                                    placeholder="Số nhà, Quận, Thành phố..." 
                                />
                            </div>
                        </div>

                        <div className="pt-4 text-right">
                            <button type="submit" className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5">
                                <i className="fas fa-save mr-2"></i> Lưu thay đổi
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="space-y-8">
                
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b">
                        <i className="fas fa-lock text-orange-500"></i> Bảo mật
                    </h3>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mật khẩu hiện tại</label>
                            <input type="password" name="oldPassword" value={passwordData.oldPassword} onChange={handlePasswordChange} className="w-full p-3 border rounded-lg text-sm focus:border-orange-500 outline-none" required placeholder="••••••"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mật khẩu mới</label>
                            <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="w-full p-3 border rounded-lg text-sm focus:border-orange-500 outline-none" required placeholder="••••••"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Xác nhận mật khẩu</label>
                            <input type="password" name="confirmNewPassword" value={passwordData.confirmNewPassword} onChange={handlePasswordChange} className="w-full p-3 border rounded-lg text-sm focus:border-orange-500 outline-none" required placeholder="••••••"/>
                        </div>
                        <button type="submit" className="w-full py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-black transition">
                            Cập nhật mật khẩu
                        </button>
                    </form>
                </div>

                <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                    <h3 className="text-red-600 font-bold mb-2 flex items-center gap-2"><i className="fas fa-exclamation-circle"></i> Vùng nguy hiểm</h3>
                    <p className="text-xs text-red-500 mb-4">Xóa tài khoản sẽ xóa vĩnh viễn tất cả CV và dữ liệu của bạn. Không thể hoàn tác.</p>
                    <button onClick={handleDeleteAccount} className="w-full py-2 border border-red-300 text-red-600 font-bold rounded-lg hover:bg-red-600 hover:text-white transition">
                        Xóa tài khoản
                    </button>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;