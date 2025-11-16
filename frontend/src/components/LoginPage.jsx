import React, { useState, useEffect } from 'react'; 
import apiService from '../apiService';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';

const ResetPasswordModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1); 
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);
        try {
            const res = await apiService.post('/auth/forgot-password', { email });
            setMessage('✅ ' + res.data.message);
            setStep(2); 
        } catch (err) {
            setMessage('❌ ' + (err.response?.data?.message || 'Lỗi gửi OTP.'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMessage('');
        if (newPassword.length < 6) {
            return setMessage('❌ Mật khẩu phải từ 6 ký tự.');
        }
        if (newPassword !== confirmPassword) {
            return setMessage('❌ Mật khẩu xác nhận không khớp.');
        }

        setIsLoading(true);
        try {
            const res = await apiService.post('/auth/reset-password', { email, otp, newPassword });
            setMessage('✅ ' + res.data.message + ' Tự động đóng sau 3s...');
            setTimeout(onClose, 3000); 
        } catch (err) {
            setMessage('❌ ' + (err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.'));
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        if (step === 1) {
            return (
                <form onSubmit={handleSendOtp} className="space-y-4">
                    <p>Nhập email để nhận mã xác thực (OTP).</p>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required 
                        className="w-full p-3 border rounded focus:border-green-500 outline-none" placeholder="Địa chỉ Email" />
                    <button type="submit" disabled={isLoading} className="w-full py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700">
                        {isLoading ? 'Đang gửi...' : 'Gửi Mã OTP'}
                    </button>
                </form>
            );
        }
        if (step === 2 || step === 3) {
            return (
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <p className="text-sm">Mã OTP đã được gửi đến **{email}**. Vui lòng kiểm tra email và nhập mã.</p>
                    <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required 
                        className="w-full p-3 border rounded focus:border-green-500 outline-none" placeholder="Mã OTP (6 chữ số)" />
                    
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required 
                        className="w-full p-3 border rounded focus:border-green-500 outline-none" placeholder="Mật khẩu mới (ít nhất 6 ký tự)" />
                    
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required 
                        className="w-full p-3 border rounded focus:border-green-500 outline-none" placeholder="Xác nhận mật khẩu mới" />

                    <button type="submit" disabled={isLoading} className="w-full py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700">
                        {isLoading ? 'Đang đặt lại...' : 'Đặt lại Mật khẩu'}
                    </button>
                </form>
            );
        }
        return null;
    };

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 ${isOpen ? '' : 'hidden'}`}>
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm animate-fade-in-up">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-xl font-bold text-gray-800">Đặt lại Mật khẩu</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                {message && (
                    <div className={`p-3 rounded mb-4 text-sm ${message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {message}
                    </div>
                )}
                {renderStep()}
            </div>
        </div>
    );
};


function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const loginError = searchParams.get('error');

    if (token) {
      localStorage.setItem('token', token);
      setMessage('Đăng nhập thành công! Đang chuyển hướng...');
      navigate('/dashboard', { replace: true });
    } else if (loginError) {
      setMessage('Đăng nhập thất bại: ' + (loginError || 'Vui lòng thử lại.'));
    }
  }, [searchParams, navigate]);
  // ---------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiService.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
        <ResetPasswordModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} />

      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-12 lg:px-24 relative">
        <h2 className="text-3xl font-bold text-topcv-primary mb-2">Welcome back</h2>
        <p className="text-gray-500 mb-8">Build a standout profile and get ideal career opportunities</p>

        {message && <div className="p-3 bg-red-50 text-red-600 rounded mb-4 text-sm">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-topcv-primary">
                <i className="fas fa-envelope"></i>
              </span>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded focus:ring-2 focus:ring-topcv-primary focus:border-transparent outline-none transition" 
                placeholder="Email" 
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
               <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-topcv-primary">
                 <i className="fas fa-lock"></i>
               </span>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded focus:ring-2 focus:ring-topcv-primary focus:border-transparent outline-none transition" 
                placeholder="Password" 
                required 
              />
            </div>
          </div>

          <div className="text-right">
            <a href="#" 
               onClick={(e) => { e.preventDefault(); setIsResetModalOpen(true); }}
               className="text-sm text-topcv-primary hover:underline"
            >
                Forgot password?
            </a>
          </div>

          <button type="submit" className="w-full py-3 bg-topcv-primary text-white font-bold rounded hover:bg-green-600 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
            Login
          </button>
        </form>


        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm mb-4">Or login with</p>
          <div className="flex gap-4 justify-center">
            <a 
              href="http://localhost:5000/api/auth/google" 
              className="flex-1 py-2 bg-red-500 text-white rounded flex items-center justify-center gap-2 text-sm font-medium hover:bg-red-600 transition"
              title="Đăng nhập bằng Google"
            >
              <i className="fab fa-google"></i> Google
            </a>
            <button
              className="flex-1 py-2 bg-blue-600 text-white rounded flex items-center justify-center gap-2 text-sm font-medium hover:bg-blue-700"
            >
              <i className="fab fa-facebook-f"></i> Facebook
            </button>
          </div>
        </div>

        <button 
          onClick={() => navigate('/editor/new')}
          className="w-full py-3 mt-8 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <i className="fas fa-user-circle mr-2"></i> **Tiếp tục với Chế độ Khách (Guest)**
        </button>


        <p className="mt-8 text-center text-sm text-gray-600">
          Don't have an account? <Link to="/register" className="text-topcv-primary font-bold hover:underline">Register now</Link>
        </p>
        <div className="mt-8 text-center text-xs text-green-600">
           © 2016. All Rights Reserved. TopCV Vietnam JSC.
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#004b23] to-[#00b14f] flex-col justify-center items-center text-white relative overflow-hidden">
        <div className="z-10 text-center p-10">
            <h1 className="text-6xl font-bold mb-4">topcv</h1>
            <h2 className="text-4xl font-bold mb-4">Tiếp lợi thế</h2>
            <h2 className="text-4xl font-bold mb-6">Nối thành công</h2>
            <p className="text-lg opacity-90 max-w-md mx-auto">TopCV - Hệ sinh thái nhân sự tiên phong ứng dụng công nghệ tại Việt Nam</p>
        </div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-96 h-96 border-r-8 border-t-8 border-white opacity-10 rounded-full"></div>
      </div>
    </div>
  );
}
export default LoginPage;