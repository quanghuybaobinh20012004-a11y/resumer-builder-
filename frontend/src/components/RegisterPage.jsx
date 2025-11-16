import React, { useState } from 'react';
import apiService from '../apiService';
import { useNavigate, Link } from 'react-router-dom';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await apiService.post('/auth/register', {
        email,
        password,
        fullName
      });

      setMessage('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (error) {
      setMessage(error.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-12 lg:px-24 relative">
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-topcv-primary mb-2">Tạo tài khoản mới</h2>
            <p className="text-gray-500">Chào mừng bạn đến với TopCV Builder. Hãy bắt đầu sự nghiệp của bạn ngay hôm nay.</p>
        </div>

        {message && (
            <div className={`p-3 rounded mb-6 text-sm ${message.includes('thành công') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {message}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-topcv-primary">
                <i className="fas fa-user"></i>
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded focus:ring-2 focus:ring-topcv-primary focus:border-transparent outline-none transition"
                placeholder="Nguyễn Văn A"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-topcv-primary">
                <i className="fas fa-envelope"></i>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded focus:ring-2 focus:ring-topcv-primary focus:border-transparent outline-none transition"
                placeholder="email@example.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
               <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-topcv-primary">
                 <i className="fas fa-lock"></i>
               </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded focus:ring-2 focus:ring-topcv-primary focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full py-3 bg-topcv-primary text-white font-bold rounded hover:bg-green-600 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Đăng ký ngay
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-topcv-primary font-bold hover:underline">
            Đăng nhập
          </Link>
        </p>

        <div className="mt-8 text-center text-xs text-green-600 opacity-60">
           © 2025 TopCV Builder Platform.
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 bg-gradient-to-tl from-[#004b23] to-[#00b14f] flex-col justify-center items-center text-white relative overflow-hidden">
         <div className="absolute top-10 right-10 text-9xl opacity-10 transform rotate-45">
            <i className="fas fa-file-invoice"></i>
         </div>
         <div className="absolute bottom-10 left-10 text-8xl opacity-10 transform -rotate-12">
            <i className="fas fa-user-tie"></i>
         </div>

         <div className="z-10 text-center p-10">
            <h1 className="text-5xl font-bold mb-6">Gia nhập cộng đồng</h1>
            <p className="text-xl opacity-90 max-w-lg mx-auto mb-8">
              Tạo CV chuyên nghiệp, kết nối với nhà tuyển dụng hàng đầu và phát triển sự nghiệp của bạn.
            </p>
            <div className="flex gap-4 justify-center">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
                    <div className="text-2xl font-bold">100+</div>
                    <div className="text-sm">Mẫu CV</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
                    <div className="text-2xl font-bold">Free</div>
                    <div className="text-sm">Trọn đời</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;