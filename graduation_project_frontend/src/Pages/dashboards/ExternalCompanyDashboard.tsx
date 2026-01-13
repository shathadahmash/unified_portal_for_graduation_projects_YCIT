import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useStore';
import Layout from '../../components/Layout';
import { projectService, Project } from '../../services/projectService';
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiCheckCircle, FiActivity, FiInfo, FiCalendar } from 'react-icons/fi';

const ExternalCompanyDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', type: 'external' });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await projectService.getProjects(); // already uses trailing slash in service
      setProjects(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('فشل تحميل المشاريع. تحقق من اتصالك بالخادم.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await projectService.updateProject(editingProject.project_id, formData);
      } else {
        await projectService.proposeProject(formData); // already uses /projects/ in service
      }
      setShowForm(false);
      setEditingProject(null);
      setFormData({ title: '', description: '', type: 'external' });
      fetchProjects();
    } catch (error) {
      console.error('Failed to submit project:', error);
      alert('حدث خطأ أثناء العملية. تأكد من اتصالك بالخادم.');
    }
  };
  // commit from ebtihal
  const handleDelete = async (projectId: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
      try {
        await projectService.deleteProject(projectId);
        fetchProjects();
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('فشل حذف المشروع');
      }
    }
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'Approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'Rejected': return 'text-red-600 bg-red-50 border-red-200';
      case 'Pending Approval': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">مرحباً، {user?.name || user?.username}</h1>
            <p className="text-gray-500 mt-1">لوحة تحكم الشركة الخارجية - إدارة ومتابعة مشاريع التخرج</p>
          </div>
          <button
            onClick={() => { setEditingProject(null); setFormData({ title: '', description: '', type: 'external' }); setShowForm(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-bold"
          >
            <FiPlus className="w-5 h-5" />
            تقديم مقترح جديد
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-blue-500 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><FiActivity className="w-8 h-8" /></div>
            <div>
              <p className="text-gray-500 text-sm font-medium">إجمالي المقترحات</p>
              <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-green-500 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl text-green-600"><FiCheckCircle className="w-8 h-8" /></div>
            <div>
              <p className="text-gray-500 text-sm font-medium">المشاريع المعتمدة</p>
              <p className="text-3xl font-bold text-gray-900">{projects.filter(p => p.state === 'Approved').length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-purple-500 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><FiClock className="w-8 h-8" /></div>
            <div>
              <p className="text-gray-500 text-sm font-medium">قيد المراجعة</p>
              <p className="text-3xl font-bold text-gray-900">{projects.filter(p => p.state === 'Pending Approval').length}</p>
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-xl text-gray-900">قائمة المشاريع</h3>
                <button onClick={fetchProjects} className="text-blue-600 hover:underline text-sm font-bold">تحديث</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">المشروع</th>
                      <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">الحالة</th>
                      <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">التواريخ</th>
                      <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">العمليات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan={4} className="text-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div></td></tr>
                    ) : projects.length > 0 ? (
                      projects.map((project) => (
                        <tr
                          key={project.project_id}
                          onClick={() => setSelectedProject(project)}
                          className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${selectedProject?.project_id === project.project_id ? 'bg-blue-50/50' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{project.title}</div>
                            <div className="text-xs text-gray-400 whitespace-normal">{project.description}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(project.state)}`}>
                              {project.state}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-1"><FiCalendar className="text-blue-400" /> البدء: {project.start_date || 'آلي'}</span>
                              <span className="flex items-center gap-1"><FiCheckCircle className="text-green-400" /> الانتهاء: {project.end_date || 'قيد التنفيذ'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => { setEditingProject(project); setFormData({ title: project.title, description: project.description, type: project.type }); setShowForm(true); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><FiEdit2 /></button>
                              <button onClick={() => handleDelete(project.project_id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><FiTrash2 /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="text-center py-10 text-gray-400">لا توجد مشاريع حالية</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-6">
            <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-2">
              <FiActivity className="text-green-600" /> تتبع حالة المشروع
            </h3>
            {selectedProject ? (
              <div className="space-y-8 relative before:absolute before:right-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {[
                  { label: 'تقديم المقترح', status: 'completed', desc: `تم البدء في ${selectedProject.start_date || 'اليوم'}` },
                  { label: 'مراجعة القسم', status: selectedProject.state !== 'Pending Approval' ? 'completed' : 'current', desc: 'يتم مراجعة المحتوى العلمي' },
                  { label: 'القرار النهائي', status: selectedProject.state === 'Approved' ? 'completed' : (selectedProject.state === 'Rejected' ? 'failed' : 'pending'), desc: selectedProject.end_date ? `تم الانتهاء في ${selectedProject.end_date}` : 'بانتظار الاعتماد النهائي' }
                ].map((step, i) => (
                  <div key={i} className="relative pr-10">
                    <div className={`absolute right-2 top-1 w-4 h-4 rounded-full border-2 bg-white z-10 ${step.status === 'completed' ? 'border-green-500 bg-green-500' :
                        step.status === 'current' ? 'border-blue-500 animate-pulse' :
                          step.status === 'failed' ? 'border-red-500 bg-red-500' : 'border-gray-300'
                      }`} />
                    <p className={`font-bold ${step.status === 'completed' ? 'text-green-700' : step.status === 'current' ? 'text-blue-700' : 'text-gray-500'}`}>{step.label}</p>
                    <p className="text-xs text-gray-400 mt-1">{step.desc}</p>
                  </div>
                ))}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm font-bold text-blue-800">المشروع المختار:</p>
                  <p className="text-sm text-blue-600 font-medium mt-1">{selectedProject.title}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400 flex flex-col items-center gap-2">
                <FiInfo className="w-10 h-10 opacity-20" />
                <p>اختر مشروعاً من القائمة لمتابعة حالته</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900">{editingProject ? 'تعديل المشروع' : 'تقديم مقترح جديد'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><FiPlus className="rotate-45 w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">عنوان المشروع</label>
                  <input
                    type="text" required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="أدخل عنوان المشروع..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">وصف المشروع</label>
                  <textarea
                    required rows={5}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="اشرح فكرة المشروع..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                    {editingProject ? 'حفظ التغييرات' : 'إرسال المقترح'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-all">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExternalCompanyDashboard;
