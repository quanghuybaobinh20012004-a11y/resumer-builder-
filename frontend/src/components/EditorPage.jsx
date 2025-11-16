import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation, useSearchParams } from 'react-router-dom'; 
import apiService from '../apiService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const ensureArray = (arr) => (arr || []).map(item => ({
    id: item.id || uuidv4(),
    value: typeof item === 'string' ? item : item.value || item,
    ...item
}));

const THEME_COLORS = ['#333333', '#2c3e50', '#0f766e', '#b45309', '#7f1d1d', '#4a4e69', '#16a34a', '#2563eb', '#9333ea', '#db2777'];
const FONT_FAMILIES = [
    { name: 'Roboto', value: "'Roboto', sans-serif" },
    { name: 'Montserrat', value: "'Montserrat', sans-serif" },
    { name: 'Open Sans', value: "'Open Sans', sans-serif" },
    { name: 'Lato', value: "'Lato', sans-serif" },
    { name: 'Times New Roman', value: "'Times New Roman', serif" },
    { name: 'Merriweather', value: "'Merriweather', serif" },
    { name: 'Playfair Display', value: "'Playfair Display', serif" },
];
const CV_TEMPLATES = [
    { id: 'modern', name: 'Hiện đại', icon: 'fa-columns' },
    { id: 'classic', name: 'Truyền thống', icon: 'fa-file-alt' },
];
const DEFAULT_LEFT_COLUMN_ORDER = ['contact', 'skills', 'interests', 'references'];
const DEFAULT_RIGHT_COLUMN_ORDER = ['summary', 'experience', 'projects', 'education', 'activities', 'certificates_awards', 'additionalInfo'];
const SECTION_ICONS = {
    personalInfo: 'fa-user-circle',
    experience: 'fa-briefcase',
    projects: 'fa-project-diagram', 
    education: 'fa-graduation-cap',
    activities: 'fa-tasks',
    skills: 'fa-star',
    certificates: 'fa-certificate',
    awards: 'fa-trophy',
    references: 'fa-users',
    interests: 'fa-heart',
    additionalInfo: 'fa-plus-circle',
    email: 'fas fa-envelope',
    phone: 'fas fa-phone-alt',
    address: 'fas fa-map-marker-alt',
    linkedin: 'fab fa-linkedin',
    dob: 'fas fa-calendar-alt',
};

const TransparentInput = ({ value, onChange, className, placeholder, style }) => (
    <input
        className={`bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-green-500 transition-colors w-full p-0.5 -ml-0.5 ${className}`}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        style={style}
    />
);
const TransparentTextarea = ({ value, onChange, className, placeholder, style }) => {
    const textareaRef = useRef(null);
    const autoResize = (target) => {
        if (target) {
            target.style.height = 'auto'; 
            target.style.height = (target.scrollHeight + 2) + 'px'; 
        }
    };
    useEffect(() => {
        autoResize(textareaRef.current);
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            className={`bg-transparent outline-none border border-transparent hover:border-gray-300 focus:border-green-500 transition-colors w-full resize-none overflow-hidden p-0.5 -ml-0.5 ${className}`}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            style={style}
            rows={1}
            onInput={(e) => autoResize(e.target)}
        />
    );
};
const AccordionSection = ({ title, sectionKey, icon, isOpen, onToggle, children }) => {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white mb-3">
        <button
          onClick={onToggle}
          className={`w-full flex justify-between items-center p-4 transition-colors ${isOpen ? 'bg-green-50 text-green-800' : 'hover:bg-gray-50 text-gray-700'}`}
        >
          <div className="flex items-center gap-3">
            <i className={`fas ${icon || 'fa-bars'} w-4 text-center ${isOpen ? 'text-green-600' : 'text-gray-400'}`}></i>
            <h3 className="font-bold text-sm">{title}</h3>
          </div>
          <i className={`fas ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-400 text-xs transition-transform`}></i>
        </button>
        {isOpen && <div className="p-4 border-t border-gray-200 bg-white animate-fade-in">{children}</div>}
      </div>
    );
};
const SidebarInput = ({ label, value, onChange, placeholder, className }) => (
    <div className={`mb-3 ${className}`}>
        {label && <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">{label}</label>}
        <input 
            value={value || ''} 
            onChange={onChange} 
            placeholder={placeholder}
            className="w-full p-2 border border-gray-300 rounded text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
        />
    </div>
);
const SidebarTextArea = ({ label, value, onChange, placeholder, height = 'h-24', onAiClick }) => (
    <div className="mb-3 relative">
        <div className="flex justify-between items-end mb-1">
            {label && <label className="block text-xs font-bold text-gray-500 uppercase">{label}</label>}
            {onAiClick && (
                <button onClick={onAiClick} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold hover:bg-purple-200 flex items-center gap-1 transition-colors" title="Viết bằng AI">
                    <i className="fas fa-magic"></i> AI Write
                </button>
            )}
        </div>
        <textarea value={value || ''} onChange={onChange} className={`w-full p-2 border border-gray-300 rounded text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none ${height}`} placeholder={placeholder} />
    </div>
);

function EditorPage() {
  const { cvId } = useParams();
  const location = useLocation(); 
  const [searchParams] = useSearchParams(); 
  
  const [cvData, setCvData] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false); 
  const previewRef = useRef(null);
  const avatarInputRef = useRef(null); 
  const [openSection, setOpenSection] = useState('personalInfo');
  
  const [cvScore, setCvScore] = useState(null);
  const [isScoring, setIsScoring] = useState(false);
  
  const IS_GUEST_SESSION = location.pathname.endsWith('/editor/new');
  const GUEST_STORAGE_KEY = 'GUEST_CV_DRAFT';

  const saveGuestDraft = (data) => {
    sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
  };
  
  const initializeDefaultData = (guestName = 'Bản nháp (Guest)') => {
    const defaultData = {
        cvName: guestName,
        personalInfo: {
            summary: '' 
        },
        settings: { color: '#333333', fontFamily: "'Roboto', sans-serif", lineHeight: 1.5, sectionSpacing: 24, fontSize: 13.5, template: 'modern' },
        experience: ensureArray(null),
        projects: ensureArray(null),
        education: ensureArray(null),
        skills: ensureArray(null),
        activities: ensureArray(null),
        awards: ensureArray(null),
        certificates: ensureArray(null),
        references: ensureArray(null),
        interests: ensureArray(null),
        leftColumnOrder: DEFAULT_LEFT_COLUMN_ORDER,
        rightColumnOrder: DEFAULT_RIGHT_COLUMN_ORDER,
        isGuest: IS_GUEST_SESSION 
    };
    return defaultData;
  };
  
  const generateStarterContent = async (industry) => {
      if (!industry) return;
      
      setIsAiLoading(true);
      
      const prompt = `Bạn là chuyên gia CV. Hãy tạo một Mục tiêu nghề nghiệp và liệt kê 5 Hard Skills, 2 Soft Skills (đặt trong bullet point riêng) cho vị trí "${industry}". Kết quả trả về phải chứa Mục tiêu trước, sau đó đến danh sách kỹ năng.`;
      
      try {
          const res = await apiService.post('/ai/generate', { prompt });
          const aiText = res.data.result;
          
          const parts = aiText.split('\n').filter(p => p.trim());
          let summary = '';
          let skills = [];
          
          if (parts.length > 0) {
              summary = parts[0]; // Dòng đầu tiên là Mục tiêu
              skills = parts.slice(1).map(p => ({
                  id: uuidv4(),
                  value: p.replace(/^-?\s*[\*\-]\s*/, '').trim() 
              }));
          }

          setCvData(prev => ({
              ...prev,
              cvName: `${industry} CV`, 
              personalInfo: {
                  ...prev.personalInfo,
                  summary: summary
              },
              skills: [...prev.skills, ...skills].filter((v, i, a) => a.findIndex(t => (t.value === v.value)) === i) 
          }));

      } catch (err) {
          console.error("Lỗi AI tạo nội dung khởi điểm:", err);
          alert("Lỗi AI tạo nội dung khởi điểm. Vui lòng tự nhập hoặc thử lại.");
      } finally {
          setIsAiLoading(false);
      }
  };


  useEffect(() => {
    const fetchCvData = async () => {
      
      const industry = searchParams.get('industry'); 
      
      if (IS_GUEST_SESSION) {
          const savedData = sessionStorage.getItem(GUEST_STORAGE_KEY);
          let data;
          if (savedData) {
              data = JSON.parse(savedData);
              data.isGuest = true;
          } else {
              data = initializeDefaultData();
              saveGuestDraft(data);
          }
          setCvData(data);
          
          if (industry) {
              generateStarterContent(industry);
          }
          
          return;
      }
      
      if (!cvId) return; 

      try {
        const response = await apiService.get(`/cvs/${cvId}`);
        const data = response.data;
        data.personalInfo = data.personalInfo || {};
        data.settings = { color: '#333333', fontFamily: "'Roboto', sans-serif", lineHeight: 1.5, sectionSpacing: 24, fontSize: 13.5, template: 'modern', ...data.settings };
        
        data.experience = ensureArray(data.experience);
        data.projects = ensureArray(data.projects); 
        data.education = ensureArray(data.education);
        data.skills = ensureArray(data.skills);
        data.activities = ensureArray(data.activities);
        data.awards = ensureArray(data.awards);
        data.certificates = ensureArray(data.certificates);
        data.references = ensureArray(data.references);
        data.interests = ensureArray(data.interests);

        data.leftColumnOrder = data.leftColumnOrder || DEFAULT_LEFT_COLUMN_ORDER;
        data.rightColumnOrder = data.rightColumnOrder || DEFAULT_RIGHT_COLUMN_ORDER;
        
        setCvData(data);
      } catch (error) { console.error("Lỗi tải CV", error); }
    };
    fetchCvData();
  }, [cvId, IS_GUEST_SESSION]); 
  
  const handleUpdate = (updater) => {
    setCvData(prev => {
        const newData = updater(prev);
        if (IS_GUEST_SESSION) {
            saveGuestDraft(newData);
        }
        return newData;
    });
  };

  const updateInfo = (field, value) => handleUpdate(prev => {
      let newState = { ...prev, personalInfo: { ...prev.personalInfo, [field]: value } };
      if (field === 'cvName') {
          newState.cvName = value;
      }
      return newState;
  });
  
  const updateSettings = (field, value) => handleUpdate(prev => ({ ...prev, settings: { ...prev.settings, [field]: value } }));
  const updateAdditionalInfo = (value) => handleUpdate(prev => ({ ...prev, additionalInfo: value }));
  
  const updateArrayItem = (section, index, field, value) => {
      handleUpdate(prev => {
          const newArr = [...prev[section]];
          newArr[index] = { ...newArr[index] };
          if (field === 'value') newArr[index].value = value;
          else newArr[index][field] = value;
          return { ...prev, [section]: newArr };
      });
  };
  
  const addItem = (section) => {
      const templates = {
          experience: { company: 'Công ty ABC', position: 'Vị trí', startDate: '2022', endDate: '2023', description: 'Mô tả công việc...' },
          projects: { name: 'Dự án Website', role: 'Fullstack Dev', startDate: '2023', endDate: '2023', description: 'Xây dựng website thương mại điện tử...' }, 
          education: { school: 'Trường ĐH', degree: 'Ngành học', startDate: '2018', endDate: '2022' },
          skills: { value: 'Kỹ năng mới' },
          activities: { name: 'Hoạt động', role: 'Vai trò', startDate: '2020', endDate: '2021', description: 'Mô tả...' },
          awards: { year: '2023', name: 'Giải thưởng' },
          certificates: { year: '2023', name: 'Chứng chỉ' },
          references: { name: 'Người tham chiếu', position: 'Chức vụ', company: 'Công ty', phone: 'SĐT', email: 'Email' },
          interests: { value: 'Sở thích' }
      };
      const newItem = { id: uuidv4(), ...templates[section] };
      handleUpdate(prev => ({ ...prev, [section]: [...prev[section], newItem] }));
  };

  const removeItem = (section, index) => {
      if (!window.confirm("Xóa mục này?")) return;
      handleUpdate(prev => {
          const list = [...prev[section]];
          list.splice(index, 1);
          return { ...prev, [section]: list };
      });
  };
  
  const handleOnDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;
    
    handleUpdate(prev => {
        let newCvData = { ...prev };
        
        if (type === 'left-column') {
            const items = Array.from(prev.leftColumnOrder);
            const [reorderedItem] = items.splice(source.index, 1);
            items.splice(destination.index, 0, reorderedItem);
            newCvData.leftColumnOrder = items;
        } else if (type === 'right-column') {
            const items = Array.from(prev.rightColumnOrder);
            const [reorderedItem] = items.splice(source.index, 1);
            items.splice(destination.index, 0, reorderedItem);
            newCvData.rightColumnOrder = items;
        } else if (prev[type]) {
            const items = Array.from(prev[type]);
            const [reorderedItem] = items.splice(source.index, 1);
            items.splice(destination.index, 0, reorderedItem);
            newCvData[type] = items;
        }
        return newCvData;
    });
  };
  
  const handleScoreCV = async () => {
    if (IS_GUEST_SESSION) return alert("Vui lòng đăng nhập để sử dụng tính năng chấm điểm CV.");
    if (!cvData || isScoring) return;
    
    setIsScoring(true);
    setCvScore(null); 
    
    try {
        const response = await apiService.post('/ai/score', { cvData }); 
        setCvScore(response.data.score);
    } catch (err) {
        alert("Lỗi chấm điểm: " + (err.response?.data?.message || err.message));
        setCvScore(0);
    } finally {
        setIsScoring(false);
    }
  };
  

  const handleAiGenerate = async (currentText, section, index, field) => {
      if (!currentText || currentText.length < 5) return alert("Vui lòng nhập ít nhất một ý ngắn gọn để AI phát triển.");
      if (isAiLoading) return;
      
      setIsAiLoading(true);
      try {
          const res = await apiService.post('/ai/generate', { prompt: `Viết lại mô tả này chuyên nghiệp hơn cho CV (ngắn gọn, súc tích): "${currentText}"` });
          const newText = res.data.result;
          
          if (section === 'personalInfo') updateInfo(field, newText);
          else if (section === 'additionalInfo') updateAdditionalInfo(newText);
          else updateArrayItem(section, index, field, newText);
          
      } catch (err) { alert("Lỗi AI: " + (err.response?.data?.message || err.message)); } 
      finally { setIsAiLoading(false); }
  };
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => updateInfo('avatar', reader.result);
        reader.readAsDataURL(file);
    }
  };
  const handleSave = async () => {
      if (IS_GUEST_SESSION) {
          return alert("Vui lòng Đăng nhập/Đăng ký để lưu vĩnh viễn CV này.");
      }
      setIsSaving(true);
      try { await apiService.put(`/cvs/${cvId}`, cvData); } catch (e) { alert("Lỗi lưu CV"); }
      setTimeout(() => setIsSaving(false), 1000);
  };
  const handleDownloadPDF = async () => {
    const input = previewRef.current;
    const originalShadow = input.style.boxShadow;
    input.style.boxShadow = 'none';
    input.querySelectorAll('.drag-handle, .avatar-overlay').forEach(el => el.style.display = 'none');
    input.querySelectorAll('input, textarea').forEach(el => el.classList.add('print-mode'));
    try {
      const canvas = await html2canvas(input, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`${cvData.cvName || 'cv'}.pdf`);
    } catch (err) { alert("Lỗi xuất PDF"); }
    finally { 
        input.style.boxShadow = originalShadow;
        input.querySelectorAll('.drag-handle, .avatar-overlay').forEach(el => el.style.display = '');
        input.querySelectorAll('input, textarea').forEach(el => el.classList.remove('print-mode'));
    }
  };
  const handleDownloadWord = async () => {
    if (IS_GUEST_SESSION) {
        return alert("Vui lòng Đăng nhập/Đăng ký để sử dụng chức năng tải xuống DOCX.");
    }
    try {
      const response = await apiService.get(`/cvs/${cvId}/docx`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', (cvData.cvName || 'cv') + '.docx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) { alert("Lỗi tải file DOCX"); }
  };


  const renderPreview = () => {
    if (!cvData) return null;
    const { settings, personalInfo } = cvData;
    const template = settings.template || 'modern'; 
    const primaryColor = settings.color || "#1e293b";
    const fontSize = (settings.fontSize || 13.5) + 'px';
    const lineHeight = settings.lineHeight || 1.5;
    const sectionSpacing = (settings.sectionSpacing || 24) + 'px';
    const bodyStyle = { fontFamily: settings.fontFamily, lineHeight, fontSize };
    const sectionWrapperStyle = { marginBottom: sectionSpacing };

    const renderSectionByKey = (key) => {
      const isClassic = template === 'classic';
      const SectionTitle = ({ title, icon }) => {
          if (isClassic) return (<div className="mb-3 border-b-2 border-gray-300 pb-1 group cursor-move select-none"><h2 className="font-bold uppercase text-gray-800 tracking-wider" style={{ fontSize: `calc(${fontSize} + 4px)` }}>{title}</h2></div>);
          return (<div className="flex items-center gap-2 mb-3 group cursor-move select-none"><div className="h-[18px] w-[3px] rounded-sm" style={{ backgroundColor: primaryColor }}></div><h2 className="font-bold uppercase tracking-wide text-gray-800 flex items-center gap-2" style={{ fontSize: `calc(${fontSize} + 2px)` }}>{icon && <i className={`text-[13px] text-[${primaryColor}]`}></i>}{title}</h2></div>);
      };

      switch (key) {
        case 'contact':
          if(template === 'classic' || (!personalInfo.email && !personalInfo.phone)) return null;
          return (
            <div className="relative group" style={sectionWrapperStyle}>
              <SectionTitle title="Thông tin liên hệ" />
              <div className="space-y-2 text-gray-700">
                {personalInfo.email && <div className="flex gap-2"><i className={`${SECTION_ICONS.email} text-gray-500 w-4 mt-1`}></i><TransparentInput value={personalInfo.email} onChange={e => updateInfo('email', e.target.value)} placeholder="Email" style={{fontSize}} /></div>}
                {personalInfo.phone && <div className="flex gap-2"><i className={`${SECTION_ICONS.phone} text-gray-500 w-4 mt-1`}></i><TransparentInput value={personalInfo.phone} onChange={e => updateInfo('phone', e.target.value)} placeholder="SĐT" style={{fontSize}} /></div>}
                {personalInfo.address && <div className="flex gap-2"><i className={`${SECTION_ICONS.address} text-gray-500 w-4 mt-1`}></i><TransparentInput value={personalInfo.address} onChange={e => updateInfo('address', e.target.value)} placeholder="Địa chỉ" style={{fontSize}} /></div>}
                {personalInfo.linkedin && <div className="flex gap-2"><i className={`${SECTION_ICONS.linkedin} text-gray-500 w-4 mt-1`}></i><TransparentInput value={personalInfo.linkedin} onChange={e => updateInfo('linkedin', e.target.value)} placeholder="LinkedIn" style={{fontSize}} /></div>}
                {personalInfo.dob && <div className="flex gap-2"><i className={`${SECTION_ICONS.dob} text-gray-500 w-4 mt-1`}></i><TransparentInput value={personalInfo.dob} onChange={e => updateInfo('dob', e.target.value)} placeholder="Ngày sinh" style={{fontSize}} /></div>}
              </div>
            </div>
          );
        case 'skills': return !cvData.skills.length ? null : <div style={sectionWrapperStyle}><SectionTitle title="Kỹ năng" /><ul className="list-disc list-inside space-y-1 text-gray-700">{cvData.skills.map((s, idx) => (<li key={s.id}><TransparentInput value={s.value} onChange={e => updateArrayItem('skills', idx, 'value', e.target.value)} style={{fontSize}} /></li>))}</ul></div>;
        case 'interests': return !cvData.interests.length ? null : <div style={sectionWrapperStyle}><SectionTitle title="Sở thích" /><div className="text-gray-700"><p>{cvData.interests.map(i => i.value).join(', ')}</p></div></div>;
        case 'summary': return !personalInfo.summary ? null : <div style={sectionWrapperStyle}><SectionTitle title="Mục tiêu nghề nghiệp" /><TransparentTextarea value={personalInfo.summary} onChange={e => updateInfo('summary', e.target.value)} placeholder="Mục tiêu..." className="text-justify text-gray-700" style={{fontSize, lineHeight}} /></div>;
        
        case 'projects':
          if (!cvData.projects || cvData.projects.length === 0) return null;
          return (
            <div style={sectionWrapperStyle}>
              <SectionTitle title="Dự án" />
              <div className="space-y-5 text-gray-700">
                {cvData.projects.map((proj, idx) => (
                  <div key={proj.id} className={`relative ${!isClassic ? 'pl-5 border-l-2 border-gray-300' : 'mb-4'}`}>
                    {!isClassic && <div className="absolute -left-[6px] top-[6px] h-[10px] w-[10px] rounded-full" style={{ backgroundColor: primaryColor }}></div>}
                    <div className="flex justify-between items-start mb-1">
                      <TransparentInput className="font-bold w-2/3 uppercase" style={{fontSize: `calc(${fontSize} + 1px)`}} value={proj.name} onChange={e => updateArrayItem('projects', idx, 'name', e.target.value)} placeholder="Tên dự án" />
                      <div className="flex w-1/3 justify-end text-gray-500 text-right" style={{fontSize}}>
                          <TransparentInput className="text-right w-20" value={proj.startDate} onChange={e => updateArrayItem('projects', idx, 'startDate', e.target.value)} placeholder="Start" /> - 
                          <TransparentInput className="text-right w-20" value={proj.endDate} onChange={e => updateArrayItem('projects', idx, 'endDate', e.target.value)} placeholder="End" />
                      </div>
                    </div>
                    <TransparentInput className="italic text-gray-600 mb-1 font-semibold" style={{fontSize}} value={proj.role} onChange={e => updateArrayItem('projects', idx, 'role', e.target.value)} placeholder="Vai trò / Công nghệ" />
                    <TransparentTextarea className="text-justify whitespace-pre-line" value={proj.description} onChange={e => updateArrayItem('projects', idx, 'description', e.target.value)} placeholder="Mô tả dự án..." style={{fontSize, lineHeight}} />
                  </div>
                ))}
              </div>
            </div>
          );

        case 'experience':
          if (!cvData.experience.length) return null;
          return (
            <div style={sectionWrapperStyle}>
              <SectionTitle title="Kinh nghiệm làm việc" />
              <div className="space-y-5 text-gray-700">
                {cvData.experience.map((exp, idx) => (
                  <div key={exp.id} className={`relative ${!isClassic ? 'pl-5 border-l-2 border-gray-300' : 'mb-4'}`}>
                    {!isClassic && <div className="absolute -left-[6px] top-[6px] h-[10px] w-[10px] rounded-full" style={{ backgroundColor: primaryColor }}></div>}
                    <div className="flex justify-between items-start mb-1">
                      <TransparentInput className="font-bold w-2/3 uppercase" style={{fontSize: `calc(${fontSize} + 1px)`}} value={exp.company} onChange={e => updateArrayItem('experience', idx, 'company', e.target.value)} placeholder="Tên công ty" />
                      <div className="flex w-1/3 justify-end text-gray-500 text-right" style={{fontSize}}>
                          <TransparentInput className="text-right w-20" value={exp.startDate} onChange={e => updateArrayItem('experience', idx, 'startDate', e.target.value)} placeholder="Bắt đầu" /> - 
                          <TransparentInput className="text-right w-20" value={exp.endDate} onChange={e => updateArrayItem('experience', idx, 'endDate', e.target.value)} placeholder="Kết thúc" />
                      </div>
                    </div>
                    <TransparentInput className="italic text-gray-600 mb-1 font-semibold" style={{fontSize}} value={exp.position} onChange={e => updateArrayItem('experience', idx, 'position', e.target.value)} placeholder="Vị trí công việc" />
                    <TransparentTextarea className="text-justify whitespace-pre-line" value={exp.description} onChange={e => updateArrayItem('experience', idx, 'description', e.target.value)} placeholder="Mô tả công việc..." style={{fontSize, lineHeight}} />
                  </div>
                ))}
              </div>
            </div>
          );
        
        case 'education':
            if (!cvData.education.length) return null;
            return (
              <div style={sectionWrapperStyle}>
                <SectionTitle title="Học vấn" />
                {cvData.education.map((edu, idx) => (
                  <div key={edu.id} className={`relative ${!isClassic ? 'pl-5 border-l-2 border-gray-300' : 'mb-4'}`}>
                    {!isClassic && <div className="absolute -left-[6px] top-[6px] h-[10px] w-[10px] rounded-full" style={{ backgroundColor: primaryColor }}></div>}
                    <div className="flex justify-between items-start">
                      <TransparentInput className="font-bold w-2/3 uppercase" style={{fontSize: `calc(${fontSize} + 1px)`}} value={edu.school} onChange={e => updateArrayItem('education', idx, 'school', e.target.value)} placeholder="Tên trường" />
                      <div className="flex w-1/3 justify-end text-gray-500" style={{fontSize}}><TransparentInput className="text-right w-20" value={edu.startDate} onChange={e => updateArrayItem('education', idx, 'startDate', e.target.value)} placeholder="Start" /> - <TransparentInput className="text-right w-20" value={edu.endDate} onChange={e => updateArrayItem('education', idx, 'endDate', e.target.value)} placeholder="End" /></div>
                    </div>
                    <TransparentInput className="italic text-gray-600" style={{fontSize}} value={edu.degree} onChange={e => updateArrayItem('education', idx, 'degree', e.target.value)} placeholder="Ngành học" />
                  </div>
                ))}
              </div>
            );

        case 'activities': 
        case 'certificates_awards':
        case 'references':
        case 'additionalInfo':
             if (key === 'additionalInfo' && !cvData.additionalInfo) return null;
             if (['activities', 'references', 'certificates_awards'].includes(key) && (!cvData[key] || cvData[key].length === 0) && (cvData.certificates?.length === 0 && cvData.awards?.length === 0)) return null;
             return (
                <div style={sectionWrapperStyle}>
                    <SectionTitle title={key === 'additionalInfo' ? 'Thông tin thêm' : key === 'references' ? 'Người giới thiệu' : key === 'activities' ? 'Hoạt động' : 'Chứng chỉ & Giải thưởng'} />
                    {key === 'additionalInfo' ? (
                        <TransparentTextarea value={cvData.additionalInfo} onChange={e => updateAdditionalInfo(e.target.value)} className="text-justify" style={{fontSize, lineHeight}} />
                    ) : (
                        <div className="text-gray-700">
                            {key === 'activities' && cvData.activities.map((act, idx) => (
                                <div key={act.id} className="mb-3">
                                    <div className="flex justify-between font-bold"><TransparentInput value={act.name} onChange={e => updateArrayItem('activities', idx, 'name', e.target.value)} /><div className="flex text-sm font-normal text-gray-500"><TransparentInput className="w-16 text-right" value={act.startDate} onChange={e => updateArrayItem('activities', idx, 'startDate', e.target.value)} /> - <TransparentInput className="w-16 text-right" value={act.endDate} onChange={e => updateArrayItem('activities', idx, 'endDate', e.target.value)} /></div></div>
                                    <TransparentInput className="italic text-sm mb-1" value={act.role} onChange={e => updateArrayItem('activities', idx, 'role', e.target.value)} />
                                    <TransparentTextarea value={act.description} onChange={e => updateArrayItem('activities', idx, 'description', e.target.value)} style={{fontSize, lineHeight}}/>
                                </div>
                            ))}
                            {key === 'references' && cvData.references.map((ref, idx) => (
                                <div key={ref.id} className="mb-3"><TransparentInput className="font-bold" value={ref.name} onChange={e => updateArrayItem('references', idx, 'name', e.target.value)} /><TransparentInput className="text-sm" value={ref.phone} onChange={e => updateArrayItem('references', idx, 'phone', e.target.value)} /></div>
                            ))}
                            {key === 'certificates_awards' && [...cvData.certificates, ...cvData.awards].map((item, idx) => (
                                <div key={item.id} className="flex gap-2"><span className="font-bold">{item.year}</span> <span>{item.name}</span></div>
                            ))}
                        </div>
                    )}
                </div>
             );
        default: return null;
      }
    };

    if (template === 'modern') {
        return (
            <div id="cv-preview-sheet" ref={previewRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl flex flex-col transition-all duration-300" style={bodyStyle}>
                <div className="flex items-center px-10 py-8 text-white relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
                    <div className="relative z-10 w-3/4 pr-4">
                        <TransparentInput className="text-4xl font-extrabold uppercase tracking-wide leading-tight text-white placeholder-white/70 mb-1" value={personalInfo.fullName} onChange={e => updateInfo('fullName', e.target.value)} placeholder="HỌ VÀ TÊN" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.3)'}} />
                        <TransparentInput className="text-lg uppercase font-medium tracking-wide opacity-90 text-white placeholder-white/70" value={personalInfo.position} onChange={e => updateInfo('position', e.target.value)} placeholder="VỊ TRÍ ỨNG TUYỂN" />
                    </div>
                    <div className="w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden flex-shrink-0 cursor-pointer relative group" onClick={() => avatarInputRef.current && avatarInputRef.current.click()}>
                        {personalInfo.avatar ? <img src={personalInfo.avatar} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" /> : <div className="w-full h-full flex items-center justify-center text-5xl text-white/50 bg-white/10"><i className="fas fa-user"></i></div>}
                        <div className="avatar-overlay absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]"><i className="fas fa-camera text-white text-2xl"></i></div>
                    </div>
                </div>
                <div className="flex flex-1 relative">
                    <Droppable droppableId="left-column" type="left-column">{(p, s) => <div className={`w-[35%] bg-gray-50/80 p-8 border-r border-gray-200 ${s.isDraggingOver ? 'bg-blue-50' : ''}`} ref={p.innerRef} {...p.droppableProps}>{cvData.leftColumnOrder.map((k, i) => <Draggable key={k} draggableId={k} index={i}>{(pd) => <div ref={pd.innerRef} {...pd.draggableProps} className="mb-2 relative group"><div {...pd.dragHandleProps} className="drag-handle absolute -top-3 -left-3 p-1 opacity-0 group-hover:opacity-100 cursor-move bg-gray-200 rounded"><i className="fas fa-grip-vertical"></i></div>{renderSectionByKey(k)}</div>}</Draggable>)}{p.placeholder}</div>}</Droppable>
                    <Droppable droppableId="right-column" type="right-column">{(p, s) => <div className={`w-[65%] p-10 ${s.isDraggingOver ? 'bg-blue-50' : ''}`} ref={p.innerRef} {...p.droppableProps}>{cvData.rightColumnOrder.map((k, i) => <Draggable key={k} draggableId={k} index={i}>{(pd) => <div ref={pd.innerRef} {...pd.draggableProps} className="mb-4 relative group"><div {...pd.dragHandleProps} className="drag-handle absolute -top-3 -left-3 p-1 opacity-0 group-hover:opacity-100 cursor-move bg-gray-200 rounded"><i className="fas fa-grip-vertical"></i></div>{renderSectionByKey(k)}</div>}</Draggable>)}{p.placeholder}</div>}</Droppable>
                </div>
            </div>
        );
    }

    if (template === 'classic') {
        return (
            <div id="cv-preview-sheet" ref={previewRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl flex flex-col p-12 transition-all duration-300" style={bodyStyle}>
                <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
                    <TransparentInput className="text-4xl font-bold uppercase text-center tracking-widest mb-2 text-gray-900" value={personalInfo.fullName} onChange={e => updateInfo('fullName', e.target.value)} placeholder="HỌ VÀ TÊN" />
                    <TransparentInput className="text-xl uppercase text-center tracking-wide text-gray-600 mb-4" value={personalInfo.position} onChange={e => updateInfo('position', e.target.value)} placeholder="VỊ TRÍ ỨNG TUYỂN" />
                    <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 mt-2">
                        {personalInfo.email && <span className="flex items-center gap-1"><i className="fas fa-envelope"></i> {personalInfo.email}</span>}
                        {personalInfo.phone && <span className="flex items-center gap-1"><i className="fas fa-phone"></i> {personalInfo.phone}</span>}
                        {personalInfo.linkedin && <span className="flex items-center gap-1"><i className="fab fa-linkedin"></i> {personalInfo.linkedin}</span>}
                    </div>
                </div>
                <div className="flex-1 space-y-6">
                    {cvData.rightColumnOrder.map((key) => <div key={key}>{renderSectionByKey(key)}</div>)}
                    {cvData.leftColumnOrder.map((key) => key !== 'contact' && <div key={key}>{renderSectionByKey(key)}</div>)}
                </div>
                <div className="hidden"><Droppable droppableId="left-column" type="left-column">{(p)=><div ref={p.innerRef} {...p.droppableProps}>{p.placeholder}</div>}</Droppable><Droppable droppableId="right-column" type="right-column">{(p)=><div ref={p.innerRef} {...p.droppableProps}>{p.placeholder}</div>}</Droppable></div>
            </div>
        );
    }
  };

  if (!cvData) return <div className="flex items-center justify-center h-screen text-green-600 font-bold"><i className="fas fa-spinner fa-spin mr-2"></i> Đang tải...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-slate-800">
      {isAiLoading && <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center cursor-wait"><div className="bg-white p-4 rounded-lg shadow-xl flex items-center gap-3"><i className="fas fa-magic fa-spin text-purple-600 text-xl"></i><span className="font-medium">AI đang viết...</span></div></div>}
      
      <header className="h-16 bg-white shadow-sm px-6 flex items-center justify-between z-20 border-b">
         <div className="flex items-center gap-4">
            {!IS_GUEST_SESSION ? (
                <Link to="/dashboard" className="text-gray-500 hover:text-green-600 font-bold flex gap-2 items-center"><i className="fas fa-chevron-left"></i> Dashboard</Link>
            ) : (
                <Link to="/login" className="text-green-600 font-bold flex gap-2 items-center hover:text-green-700">Đăng nhập</Link>
            )}
            
            <div className="h-6 w-px bg-gray-300 mx-2"></div>
            
            <input value={cvData.cvName} onChange={(e) => updateInfo('cvName', e.target.value)} className="text-lg font-bold outline-none bg-transparent hover:bg-gray-50 px-2 py-1 rounded" disabled={IS_GUEST_SESSION}/>
            
            <Link 
              to="/guide" 
              target="_blank" 
              className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full hover:bg-green-100 flex items-center gap-1"
            >
              <i className="fas fa-book-open"></i> Hướng dẫn
            </Link>

         </div>
         <div className="flex gap-3">
             <button 
                 onClick={handleDownloadPDF} 
                 className="px-4 py-2 border rounded hover:bg-gray-50 font-bold text-gray-700 flex gap-2 items-center"
             >
                 <i className="fas fa-file-pdf text-red-500"></i> PDF
             </button>
             
             <button 
                 onClick={handleDownloadWord} 
                 disabled={IS_GUEST_SESSION}
                 className={`px-4 py-2 border rounded font-bold flex gap-2 items-center transition-all ${IS_GUEST_SESSION ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50 text-gray-700'}`}
             >
                 <i className="fas fa-file-word text-blue-600"></i> WORD
             </button>
             
             <button 
                 onClick={IS_GUEST_SESSION ? () => alert("Vui lòng đăng nhập để lưu!") : handleSave} 
                 disabled={isSaving && !IS_GUEST_SESSION} 
                 className={`px-6 py-2 font-bold rounded shadow flex gap-2 items-center transition-all 
                     ${IS_GUEST_SESSION ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-green-600 text-white hover:bg-green-700'}`
                 }
             >
                 {IS_GUEST_SESSION ? <i className="fas fa-sign-in-alt"></i> : (isSaving ? <i className="fas fa-spin fa-spinner"></i> : <i className="fas fa-save"></i>)} 
                 {IS_GUEST_SESSION ? 'Đăng nhập để lưu' : (isSaving ? 'Đang lưu' : 'Lưu')}
             </button>
         </div>
      </header>

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-96 bg-white border-r flex flex-col shadow-xl z-10">
              <div className="flex border-b">
                  <button onClick={() => setActiveTab('content')} className={`flex-1 py-4 font-bold text-sm ${activeTab === 'content' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:bg-gray-50'}`}>Nội dung</button>
                  <button onClick={() => setActiveTab('design')} className={`flex-1 py-4 font-bold text-sm ${activeTab === 'design' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:bg-gray-50'}`}>Thiết kế</button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
                  <div className={`bg-white p-4 rounded-xl shadow-md border mb-4 ${IS_GUEST_SESSION ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="flex justify-between items-center mb-3">
                          <h4 className="font-bold text-sm text-gray-700 flex items-center gap-2"><i className="fas fa-star text-yellow-500"></i> CV Score (AI)</h4>
                          <button 
                              onClick={handleScoreCV} 
                              disabled={isScoring || IS_GUEST_SESSION}
                              className={`text-xs px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1 ${IS_GUEST_SESSION ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                          >
                              {isScoring ? <i className="fas fa-sync-alt fa-spin"></i> : <i className="fas fa-chart-line"></i>}
                              {isScoring ? 'Đang chấm...' : 'Chấm điểm ngay'}
                          </button>
                      </div>
                      
                      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          {cvScore !== null && (
                              <div 
                                  className="h-full rounded-full transition-all duration-1000" 
                                  style={{ 
                                      width: `${cvScore}%`,
                                      backgroundColor: cvScore >= 80 ? '#10b981' : cvScore >= 60 ? '#f59e0b' : '#ef4444' // Green, Amber, Red
                                  }}
                              ></div>
                          )}
                      </div>
                      <div className={`text-right text-xs font-bold mt-1 ${cvScore >= 80 ? 'text-green-600' : 'text-gray-500'}`}>
                          {cvScore !== null ? `${cvScore}/100` : (isScoring ? '...' : 'Chưa có điểm')}
                      </div>
                  </div>
                  
                  {activeTab === 'content' && (
                      <div className="space-y-4">
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} ref={avatarInputRef} />
                          
                          <AccordionSection title="Thông tin cá nhân" sectionKey="personalInfo" icon={SECTION_ICONS.personalInfo} isOpen={openSection === 'personalInfo'} onToggle={() => setOpenSection(openSection === 'personalInfo' ? null : 'personalInfo')}>
                              <div className="space-y-3">
                                  <div className="flex items-center gap-3 mb-2">
                                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border shrink-0">
                                          {cvData.personalInfo.avatar ? <img src={cvData.personalInfo.avatar} className="w-full h-full object-cover" crossOrigin="anonymous"/> : <i className="fas fa-user flex items-center justify-center h-full text-gray-400"></i>}
                                      </div>
                                      <button onClick={() => avatarInputRef.current.click()} className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 font-bold text-gray-600 shadow-sm">Đổi ảnh</button>
                                  </div>
                                  <SidebarInput label="Họ và tên" value={cvData.personalInfo.fullName} onChange={e => updateInfo('fullName', e.target.value)} placeholder="Nguyễn Văn A" />
                                  <SidebarInput label="Vị trí ứng tuyển" value={cvData.personalInfo.position} onChange={e => updateInfo('position', e.target.value)} placeholder="Frontend Developer" />
                                  <div className="grid grid-cols-2 gap-2">
                                      <SidebarInput label="Email" value={cvData.personalInfo.email} onChange={e => updateInfo('email', e.target.value)} placeholder="email@example.com" />
                                      <SidebarInput label="Số điện thoại" value={cvData.personalInfo.phone} onChange={e => updateInfo('phone', e.target.value)} placeholder="0909..." />
                                  </div>
                                  <SidebarInput label="Địa chỉ" value={cvData.personalInfo.address} onChange={e => updateInfo('address', e.target.value)} placeholder="Quận 1, TP.HCM" />
                                  <div className="grid grid-cols-2 gap-2">
                                      <SidebarInput label="Ngày sinh" value={cvData.personalInfo.dob} onChange={e => updateInfo('dob', e.target.value)} placeholder="01/01/2000" />
                                      <SidebarInput label="LinkedIn" value={cvData.personalInfo.linkedin} onChange={e => updateInfo('linkedin', e.target.value)} placeholder="linkedin.com/in/..." />
                                  </div>
                                  <SidebarTextArea label="Mục tiêu nghề nghiệp" value={cvData.personalInfo.summary} onChange={e => updateInfo('summary', e.target.value)} onAiClick={() => handleAiGenerate(cvData.personalInfo.summary, 'personalInfo', null, 'summary')} placeholder="Mô tả mục tiêu..." />
                              </div>
                          </AccordionSection>
                          
                          {[
                              { key: 'experience', title: 'Kinh nghiệm', icon: SECTION_ICONS.experience },
                              { key: 'projects', title: 'Dự án', icon: SECTION_ICONS.projects }, 
                              { key: 'education', title: 'Học vấn', icon: SECTION_ICONS.education }, 
                              { key: 'activities', title: 'Hoạt động', icon: SECTION_ICONS.activities }, 
                              { key: 'skills', title: 'Kỹ năng', icon: SECTION_ICONS.skills }, 
                              { key: 'certificates', title: 'Chứng chỉ', icon: SECTION_ICONS.certificates }, 
                              { key: 'awards', title: 'Giải thưởng', icon: SECTION_ICONS.awards },
                              { key: 'references', title: 'Người giới thiệu', icon: SECTION_ICONS.references }, 
                              { key: 'interests', title: 'Sở thích', icon: SECTION_ICONS.interests }
                          ].map(s => (
                              <AccordionSection key={s.key} title={s.title} sectionKey={s.key} icon={s.icon} isOpen={openSection === s.key} onToggle={() => setOpenSection(openSection === s.key ? null : s.key)}>
                                  <Droppable droppableId={s.key} type={s.key}>
                                      {(provided) => (
                                          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                                              {cvData[s.key].map((item, idx) => (
                                                  <Draggable key={item.id} draggableId={item.id.toString()} index={idx}>
                                                      {(providedDrag) => (
                                                          <div ref={providedDrag.innerRef} {...providedDrag.draggableProps} className="bg-white p-4 border rounded shadow-sm relative group">
                                                              <div {...providedDrag.dragHandleProps} className="absolute top-2 right-2 text-gray-300 cursor-grab"><i className="fas fa-grip-vertical"></i></div>
                                                              <div className="absolute top-2 right-8 text-gray-300 cursor-pointer hover:text-red-500" onClick={() => removeItem(s.key, idx)}><i className="fas fa-trash"></i></div>
                                                              
                                                              {s.key === 'experience' && (
                                                                  <>
                                                                      <SidebarInput label="Tên công ty" value={item.company} onChange={e => updateArrayItem(s.key, idx, 'company', e.target.value)} />
                                                                      <SidebarInput label="Vị trí" value={item.position} onChange={e => updateArrayItem(s.key, idx, 'position', e.target.value)} />
                                                                      <div className="grid grid-cols-2 gap-2">
                                                                          <SidebarInput label="Bắt đầu" value={item.startDate} onChange={e => updateArrayItem(s.key, idx, 'startDate', e.target.value)} />
                                                                          <SidebarInput label="Kết thúc" value={item.endDate} onChange={e => updateArrayItem(s.key, idx, 'endDate', e.target.value)} />
                                                                      </div>
                                                                      <SidebarTextArea label="Mô tả" value={item.description} onChange={e => updateArrayItem(s.key, idx, 'description', e.target.value)} onAiClick={() => handleAiGenerate(item.description, s.key, idx, 'description')} height="h-20" />
                                                                  </>
                                                              )}
                                                              {s.key === 'projects' && (
                                                                  <>
                                                                      <SidebarInput label="Tên dự án" value={item.name} onChange={e => updateArrayItem(s.key, idx, 'name', e.target.value)} />
                                                                      <SidebarInput label="Vai trò / Công nghệ" value={item.role} onChange={e => updateArrayItem(s.key, idx, 'role', e.target.value)} />
                                                                      <div className="grid grid-cols-2 gap-2">
                                                                          <SidebarInput label="Bắt đầu" value={item.startDate} onChange={e => updateArrayItem(s.key, idx, 'startDate', e.target.value)} />
                                                                          <SidebarInput label="Kết thúc" value={item.endDate} onChange={e => updateArrayItem(s.key, idx, 'endDate', e.target.value)} />
                                                                      </div>
                                                                      <SidebarTextArea label="Mô tả dự án" value={item.description} onChange={e => updateArrayItem(s.key, idx, 'description', e.target.value)} onAiClick={() => handleAiGenerate(item.description, s.key, idx, 'description')} height="h-20" />
                                                                  </>
                                                              )}
                                                              {s.key === 'education' && (
                                                                  <>
                                                                      <SidebarInput label="Trường học" value={item.school} onChange={e => updateArrayItem(s.key, idx, 'school', e.target.value)} />
                                                                      <SidebarInput label="Ngành học" value={item.degree} onChange={e => updateArrayItem(s.key, idx, 'degree', e.target.value)} />
                                                                      <div className="grid grid-cols-2 gap-2">
                                                                          <SidebarInput label="Bắt đầu" value={item.startDate} onChange={e => updateArrayItem(s.key, idx, 'startDate', e.target.value)} />
                                                                          <SidebarInput label="Kết thúc" value={item.endDate} onChange={e => updateArrayItem(s.key, idx, 'endDate', e.target.value)} />
                                                                      </div>
                                                                  </>
                                                              )}
                                                              {s.key === 'activities' && (
                                                                  <>
                                                                      <SidebarInput label="Hoạt động" value={item.name} onChange={e => updateArrayItem(s.key, idx, 'name', e.target.value)} />
                                                                      <SidebarInput label="Vai trò" value={item.role} onChange={e => updateArrayItem(s.key, idx, 'role', e.target.value)} />
                                                                      <div className="grid grid-cols-2 gap-2">
                                                                          <SidebarInput label="Bắt đầu" value={item.startDate} onChange={e => updateArrayItem(s.key, idx, 'startDate', e.target.value)} />
                                                                          <SidebarInput label="Kết thúc" value={item.endDate} onChange={e => updateArrayItem(s.key, idx, 'endDate', e.target.value)} />
                                                                      </div>
                                                                      <SidebarTextArea label="Mô tả" value={item.description} onChange={e => updateArrayItem(s.key, idx, 'description', e.target.value)} height="h-20" />
                                                                  </>
                                                              )}
                                                              {s.key === 'skills' && <SidebarInput label="Kỹ năng" value={item.value} onChange={e => updateArrayItem(s.key, idx, 'value', e.target.value)} />}
                                                              {s.key === 'interests' && <SidebarInput label="Sở thích" value={item.value} onChange={e => updateArrayItem(s.key, idx, 'value', e.target.value)} />}
                                                              {(s.key === 'certificates' || s.key === 'awards') && (
                                                                  <div className="flex gap-2">
                                                                      <div className="w-1/3"><SidebarInput label="Năm" value={item.year} onChange={e => updateArrayItem(s.key, idx, 'year', e.target.value)} /></div>
                                                                      <div className="w-2/3"><SidebarInput label="Tên" value={item.name} onChange={e => updateArrayItem(s.key, idx, 'name', e.target.value)} /></div>
                                                                  </div>
                                                              )}
                                                              {s.key === 'references' && (
                                                                  <>
                                                                      <SidebarInput label="Tên người tham chiếu" value={item.name} onChange={e => updateArrayItem(s.key, idx, 'name', e.target.value)} />
                                                                      <SidebarInput label="Chức vụ" value={item.position} onChange={e => updateArrayItem(s.key, idx, 'position', e.target.value)} />
                                                                      <SidebarInput label="Công ty" value={item.company} onChange={e => updateArrayItem(s.key, idx, 'company', e.target.value)} />
                                                                      <div className="grid grid-cols-2 gap-2">
                                                                          <SidebarInput label="SĐT" value={item.phone} onChange={e => updateArrayItem(s.key, idx, 'phone', e.target.value)} />
                                                                          <SidebarInput label="Email" value={item.email} onChange={e => updateArrayItem(s.key, idx, 'email', e.target.value)} />
                                                                      </div>
                                                                  </>
                                                              )}
                                                          </div>
                                                      )}
                                                  </Draggable>
                                              ))}
                                              {provided.placeholder}
                                          </div>
                                      )}
                                  </Droppable>
                                  <button onClick={() => addItem(s.key)} className="mt-3 w-full py-2 border-dashed border-2 border-green-200 text-green-600 font-bold rounded hover:bg-green-50"><i className="fas fa-plus"></i> Thêm {s.title}</button>
                              </AccordionSection>
                          ))}
                          
                          <AccordionSection title="Thông tin thêm" sectionKey="additionalInfo" icon={SECTION_ICONS.additionalInfo} isOpen={openSection === 'additionalInfo'} onToggle={() => setOpenSection(openSection === 'additionalInfo' ? null : 'additionalInfo')}>
                              <SidebarTextArea value={cvData.additionalInfo} onChange={e => updateAdditionalInfo(e.target.value)} onAiClick={() => handleAiGenerate(cvData.additionalInfo, 'additionalInfo', null, null)} placeholder="Nhập thông tin thêm..." />
                          </AccordionSection>
                      </div>
                  )}
                  {activeTab === 'design' && (
                      <div className="space-y-6 p-1">
                          {/* Chọn Mẫu CV */}
                          <div className="bg-white p-5 rounded-xl shadow-sm border">
                              <h3 className="font-bold text-xs uppercase mb-4 text-gray-500 flex gap-2"><i className="fas fa-layer-group"></i> Mẫu CV</h3>
                              <div className="grid grid-cols-2 gap-3">
                                  {CV_TEMPLATES.map(tpl => (
                                      <button key={tpl.id} onClick={() => updateSettings('template', tpl.id)} className={`p-3 rounded-lg border-2 text-center transition-all ${cvData.settings.template === tpl.id ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'}`}>
                                          <i className={`fas ${tpl.icon} text-2xl mb-2`}></i><div className="text-xs font-bold">{tpl.name}</div>
                                      </button>
                                  ))}
                              </div>
                          </div>
                          {/* Màu sắc */}
                          <div className="bg-white p-5 rounded-xl shadow-sm border">
                              <h3 className="font-bold text-xs uppercase mb-4 text-gray-500 flex gap-2"><i className="fas fa-palette"></i> Màu chủ đạo</h3>
                              <div className="flex flex-wrap gap-3">
                                  {THEME_COLORS.map(c => (<button key={c} onClick={() => updateSettings('color', c)} className={`h-8 w-8 rounded-full shadow-sm border-2 ${cvData.settings.color === c ? 'border-gray-800 scale-110' : 'border-white'}`} style={{backgroundColor: c}}></button>))}
                                  <label className="h-8 w-8 rounded-full border-dashed border-2 border-gray-300 flex items-center justify-center cursor-pointer"><i className="fas fa-plus text-xs text-gray-400"></i><input type="color" className="opacity-0 absolute w-0 h-0" onChange={(e) => updateSettings('color', e.target.value)}/></label>
                              </div>
                          </div>
                          {/* Font chữ */}
                          <div className="bg-white p-5 rounded-xl shadow-sm border">
                              <h3 className="font-bold text-xs uppercase mb-4 text-gray-500 flex gap-2"><i className="fas fa-font"></i> Font chữ</h3>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {FONT_FAMILIES.map(f => (<button key={f.name} onClick={() => updateSettings('fontFamily', f.value)} className={`w-full text-left px-3 py-2 text-sm border rounded ${cvData.settings.fontFamily === f.value ? 'bg-green-50 border-green-500 text-green-700' : 'hover:bg-gray-50'}`} style={{fontFamily: f.value}}>{f.name}</button>))}
                              </div>
                          </div>
                          {/* Sliders */}
                          <div className="bg-white p-5 rounded-xl shadow-sm border space-y-4">
                              <h3 className="font-bold text-xs uppercase mb-2 text-gray-500 flex gap-2"><i className="fas fa-sliders-h"></i> Bố cục</h3>
                              <div><div className="flex justify-between text-xs mb-1"><span>Cỡ chữ</span><b>{cvData.settings.fontSize}px</b></div><input type="range" min="11" max="16" step="0.5" value={cvData.settings.fontSize || 13.5} onChange={(e) => updateSettings('fontSize', parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"/></div>
                              <div><div className="flex justify-between text-xs mb-1"><span>Giãn dòng</span><b>{cvData.settings.lineHeight}</b></div><input type="range" min="1.0" max="2.0" step="0.1" value={cvData.settings.lineHeight || 1.5} onChange={(e) => updateSettings('lineHeight', parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"/></div>
                          </div>
                      </div>
                  )}
              </div>
          </div>

          <div className="flex-1 bg-gray-100 p-8 overflow-y-auto flex justify-center items-start relative">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
             {renderPreview()}
          </div>
        </div>
      </DragDropContext> 
    </div>
  );
}

export default EditorPage;