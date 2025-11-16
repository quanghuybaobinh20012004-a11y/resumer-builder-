
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService from '../apiService'; 

const simpleDeepCompare = (obj1, obj2) => {
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        return obj1 === obj2;
    }
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        return JSON.stringify(obj1) === JSON.stringify(obj2); 
    }
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (!keys2.includes(key) || !simpleDeepCompare(obj1[key], obj2[key])) {
            return false;
        }
    }
    return true;
};





const DiffMarker = ({ isDiff, children }) => (
    <div className={`transition-all duration-500 ${isDiff ? 'bg-yellow-100 border border-yellow-400 rounded-lg p-2' : 'p-2'}`}>
        {children}
    </div>
);

const CvDisplay = ({ cv, isDiffs }) => {
    if (!cv) return <div className="text-center text-gray-500">Dữ liệu CV không khả dụng.</div>;
    
    const renderArraySection = (title, items, isDiff, keyAccessor) => (
        <section className="mb-6">
            <h3 className="text-xl font-semibold mb-2 border-b pb-1 text-indigo-700">{title}</h3>
            <DiffMarker isDiff={isDiff}>
                {items.length === 0 ? (
                    <p className="text-sm italic text-gray-500">Chưa có thông tin.</p>
                ) : (
                    <ul className="space-y-3">
                        {items.map((item, index) => (
                            <li key={item.id || index} className="text-sm border-l-2 border-gray-300 pl-3">
                                {keyAccessor === 'experience' && (
                                    <>
                                        <p className="font-bold">{item.company} | {item.position}</p>
                                        <p className="text-xs text-gray-500">{item.startDate} - {item.endDate}</p>
                                    </>
                                )}
                                {keyAccessor === 'education' && (
                                    <>
                                        <p className="font-bold">{item.school} - {item.degree}</p>
                                        <p className="text-xs text-gray-500">{item.startDate} - {item.endDate}</p>
                                    </>
                                )}
                                {keyAccessor === 'projects' && (
                                    <p className="font-bold">{item.name}</p>
                                )}
                                {keyAccessor === 'skills' && (
                                    <p>{typeof item === 'string' ? item : item.value}</p>
                                )}
                                {item.description && <p className="text-gray-600 italic mt-1">{item.description.substring(0, 100)}...</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </DiffMarker>
        </section>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg h-full overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">{cv.cvName || 'CV Chưa Đặt Tên'}</h2>
            
            <section className="mb-6 p-4 border rounded-lg">
                <h3 className="text-xl font-semibold mb-2 border-b pb-1 text-indigo-700">Thông tin cá nhân</h3>
                <DiffMarker isDiff={isDiffs.personalInfoDiff}>
                    <p className="font-bold text-lg">{cv.personalInfo?.fullName}</p>
                    <p className="text-sm text-gray-600">{cv.personalInfo?.position}</p>
                    <p className="text-sm">Email: {cv.personalInfo?.email}</p>
                    <p className="text-sm">Điện thoại: {cv.personalInfo?.phone}</p>
                    <p className="mt-2 italic text-gray-700">Mục tiêu: {cv.personalInfo?.summary?.substring(0, 100)}...</p>
                </DiffMarker>
            </section>

            
            {renderArraySection('Kinh nghiệm làm việc', cv.experience || [], isDiffs.experienceDiff, 'experience')}

          
            {renderArraySection('Học vấn', cv.education || [], isDiffs.educationDiff, 'education')}
            
            {renderArraySection('Dự án', cv.projects || [], isDiffs.projectsDiff, 'projects')}

            <section className="mb-6">
                <h3 className="text-xl font-semibold mb-2 border-b pb-1 text-indigo-700">Kỹ năng</h3>
                <DiffMarker isDiff={isDiffs.skillsDiff}>
                    <p className="text-sm">
                        {cv.skills?.map(s => (typeof s === 'string' ? s : s.value || s)).join(' • ') || 'Chưa có thông tin.'}
                    </p>
                </DiffMarker>
            </section>
        </div>
    );
};


function ComparisonPage() {
    const { cvId1, cvId2 } = useParams();
    const [cv1, setCv1] = useState(null);
    const [cv2, setCv2] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCvs = async () => {
            setLoading(true);
            setError('');
            try {
                const [res1, res2] = await Promise.all([
                    apiService.get(`/cvs/${cvId1}`),
                    apiService.get(`/cvs/${cvId2}`),
                ]);
                setCv1(res1.data);
                setCv2(res2.data);
            } catch (err) {
                setError(err.response?.data?.message || "Không thể tải dữ liệu của CV.");
            } finally {
                setLoading(false);
            }
        };
        if (cvId1 && cvId2) fetchCvs();
    }, [cvId1, cvId2]);


    const diffs = useMemo(() => {
        if (!cv1 || !cv2) return {};
        
        const personalInfoDiff = !simpleDeepCompare(cv1.personalInfo, cv2.personalInfo);
        const experienceDiff = !simpleDeepCompare(cv1.experience, cv2.experience);
        const educationDiff = !simpleDeepCompare(cv1.education, cv2.education);
        const projectsDiff = !simpleDeepCompare(cv1.projects, cv2.projects);
        const skillsDiff = !simpleDeepCompare(cv1.skills, cv2.skills);

        return { personalInfoDiff, experienceDiff, educationDiff, projectsDiff, skillsDiff };
    }, [cv1, cv2]);


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-xl text-indigo-600"><i className="fas fa-spinner fa-spin mr-2"></i> Đang tải dữ liệu so sánh...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-700">
                <div className="p-8 bg-white rounded-xl shadow-lg border border-red-300">
                    <i className="fas fa-exclamation-triangle mr-2"></i> {error}
                </div>
            </div>
        );
    }

    const totalDiffs = Object.values(diffs).filter(d => d).length;
    const isIdentical = totalDiffs === 0;

    return (
        <div className="min-h-screen bg-gray-100 p-8 font-sans">
            <header className="max-w-7xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow">
                <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                    <i className="fas fa-arrow-left mr-2"></i> Quay lại
                </Link>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <i className="fas fa-balance-scale-right text-indigo-500"></i> So sánh Phiên bản CV
                </h1>
                <div className={`p-2 rounded-lg font-bold text-sm shadow-md ${isIdentical ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isIdentical ? '✅ KHÔNG có khác biệt' : `⚠️ ${totalDiffs} khác biệt được tìm thấy`}
                </div>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[70vh]">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold mb-3 text-gray-700 text-center">CV 1: ID {cvId1}</h2>
                    <CvDisplay cv={cv1} isDiffs={diffs} />
                </div>
                
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold mb-3 text-gray-700 text-center">CV 2: ID {cvId2}</h2>
                    <CvDisplay cv={cv2} isDiffs={diffs} />
                </div>
            </main>

            <footer className="mt-8 text-center text-xs text-gray-500">
                * Các mục được đánh dấu màu vàng (hoặc có viền) là các phần có sự khác biệt về nội dung hoặc thứ tự.
            </footer>
        </div>
    );
}

export default ComparisonPage;