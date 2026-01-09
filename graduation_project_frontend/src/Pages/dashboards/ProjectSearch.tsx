import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiChevronDown, FiX, FiInfo, FiCalendar, FiUser, FiBookOpen } from 'react-icons/fi';
import { projectService } from '../../services/projectService';

const ProjectSearch: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // الفلاتر (التي كانت مفقودة في الرد السابق)
  const [filters, setFilters] = useState({ college: '', supervisor: '', year: '' });
  const [filterOptions, setFilterOptions] = useState<any>({ colleges: [], supervisors: [], years: [] });
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // مودال التفاصيل
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // دالة البحث والفلترة المشتركة
  const fetchProjects = useCallback(async (currentSearch: string, currentFilters: any) => {
    setLoading(true);
    try {
      const params = {
        search: currentSearch,
        college: currentFilters.college,
        supervisor: currentFilters.supervisor,
        year: currentFilters.year,
      };
      const data = await projectService.getProjects(params);
      setProjects(data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // تنفيذ البحث والفلترة اللحظية
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects(searchQuery, filters);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, filters, fetchProjects]);

  // جلب خيارات الفلاتر عند البداية
  useEffect(() => {
    projectService.getFilterOptions().then(setFilterOptions);
  }, []);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen" dir="rtl">
      
      {/* 1. قسم البحث النصي */}
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث بالعنوان أو الوصف (تحديث لحظي)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 pr-12 border-none rounded-2xl shadow-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500" size={22} />
        </div>
      </div>

      {/* 2. قسم الفلاتر (الكلية، المشرف، السنة) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {/* فلتر الكلية */}
        <div className="relative">
          <button onClick={() => setActiveDropdown(activeDropdown === 'col' ? null : 'col')} className="w-full p-3 bg-white rounded-xl shadow-sm flex justify-between items-center">
            <FiChevronDown />
            <span>{filterOptions.colleges.find((c:any) => String(c.id) === filters.college)?.name || 'كل الكليات'}</span>
          </button>
          {activeDropdown === 'col' && (
            <div className="absolute z-20 w-full mt-1 bg-white border rounded-xl shadow-xl max-h-48 overflow-y-auto">
              <div onClick={() => { setFilters({...filters, college: ''}); setActiveDropdown(null); }} className="p-2 hover:bg-blue-50 cursor-pointer text-blue-600 border-b">الكل</div>
              {filterOptions.colleges.map((c: any) => (
                <div key={c.id} onClick={() => { setFilters({...filters, college: String(c.id)}); setActiveDropdown(null); }} className="p-2 hover:bg-gray-50 cursor-pointer text-right">{c.name}</div>
              ))}
            </div>
          )}
        </div>

        {/* فلتر المشرف */}
        <div className="relative">
          <button onClick={() => setActiveDropdown(activeDropdown === 'sup' ? null : 'sup')} className="w-full p-3 bg-white rounded-xl shadow-sm flex justify-between items-center">
            <FiChevronDown />
            <span>{filterOptions.supervisors.find((s:any) => String(s.id) === filters.supervisor)?.name || 'كل المشرفين'}</span>
          </button>
          {activeDropdown === 'sup' && (
            <div className="absolute z-20 w-full mt-1 bg-white border rounded-xl shadow-xl max-h-48 overflow-y-auto">
              <div onClick={() => { setFilters({...filters, supervisor: ''}); setActiveDropdown(null); }} className="p-2 hover:bg-blue-50 cursor-pointer text-blue-600 border-b">الكل</div>
              {filterOptions.supervisors.map((s: any) => (
                <div key={s.id} onClick={() => { setFilters({...filters, supervisor: String(s.id)}); setActiveDropdown(null); }} className="p-2 hover:bg-gray-50 cursor-pointer text-right">{s.name}</div>
              ))}
            </div>
          )}
        </div>

        {/* فلتر السنة */}
        <div className="relative">
          <button onClick={() => setActiveDropdown(activeDropdown === 'yr' ? null : 'yr')} className="w-full p-3 bg-white rounded-xl shadow-sm flex justify-between items-center">
            <FiChevronDown />
            <span>{filters.year || 'كل السنوات'}</span>
          </button>
          {activeDropdown === 'yr' && (
            <div className="absolute z-20 w-full mt-1 bg-white border rounded-xl shadow-xl max-h-48 overflow-y-auto">
              <div onClick={() => { setFilters({...filters, year: ''}); setActiveDropdown(null); }} className="p-2 hover:bg-blue-50 cursor-pointer text-blue-600 border-b">الكل</div>
              {filterOptions.years.map((y: string) => (
                <div key={y} onClick={() => { setFilters({...filters, year: y}); setActiveDropdown(null); }} className="p-2 hover:bg-gray-50 cursor-pointer text-right">{y}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. شبكة المشاريع */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-10">جاري التحميل...</div>
        ) : projects.map((project) => (
          <div key={project.project_id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-all">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full">{project.type}</span>
                <span className="text-gray-400 text-xs">{project.year}</span>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-3 line-clamp-2">{project.title}</h3>
              <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                <FiUser className="text-blue-400" /> {project.supervisor_name}
              </p>
            </div>
            
            <button onClick={() => { setSelectedProject(project); setIsModalOpen(true); }} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
              <FiInfo /> تفاصيل المشروع
            </button>
          </div>
        ))}
      </div>

      {/* 4. مودال التفاصيل (Pop-up) */}
      {isModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
              <h2 className="text-xl font-bold">تفاصيل المشروع الكاملة</h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-blue-700 p-2 rounded-full"><FiX size={24} /></button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto text-right">
              <h3 className="text-2xl font-black text-gray-900">{selectedProject.title}</h3>
              <div className="grid grid-cols-2 gap-4 border-y py-4 border-gray-100">
                <div><p className="text-xs text-gray-400">المشرف</p><p className="font-bold">{selectedProject.supervisor_name}</p></div>
                <div><p className="text-xs text-gray-400">الكلية</p><p className="font-bold">{selectedProject.college_name}</p></div>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-2">وصف المشروع:</h4>
                <p className="text-gray-600 leading-relaxed">{selectedProject.description}</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 text-center">
              <button onClick={() => setIsModalOpen(false)} className="px-10 py-2 bg-gray-200 rounded-xl font-bold">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSearch;