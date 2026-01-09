import React, { useEffect, useState } from 'react';
import { userService, User } from '../services/userService';

const CoSupervisorsTable: React.FC = () => {
  const [coSupervisors, setCoSupervisors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoSupervisors = async () => {
      try {
        setLoading(true);
        const allUsers = await userService.getAllUsers();
        // فلتر فقط المشرفين المساعدين
        // Match common role name variants (case-insensitive, hyphen/underscore tolerant)
        const filtered = allUsers.filter(u =>
          u.roles.some(r => {
            const t = (r.type || '').toString().toLowerCase();
            return (
              t === 'co_supervisor' ||
              t === 'co-supervisor' ||
              t === 'co supervisor' ||
              t === 'co-supervisor' ||
              (t.includes('co') && t.includes('supervisor'))
            );
          })
        );
        setCoSupervisors(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoSupervisors();
  }, []);

  const handleDelete = async (userId: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المشرف المساعد؟')) return;
    try {
      await userService.deleteUser(userId);
      setCoSupervisors(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert('فشل حذف المشرف المساعد');
    }
  };

  if (loading) return <div className="p-4 text-center">جاري تحميل المشرفين المساعدين...</div>;

  if (coSupervisors.length === 0) return <div className="p-4 text-center text-gray-500">لا يوجد مشرفون مساعدين</div>;

  return (
    <div className="p-4 overflow-x-auto bg-white rounded-xl shadow">
      <table className="w-full border-collapse text-center">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">#</th>
            <th className="p-2 border">الاسم</th>
            <th className="p-2 border">البريد</th>
            <th className="p-2 border">الهاتف</th>
            <th className="p-2 border">الأدوار</th>
            <th className="p-2 border">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {coSupervisors.map((u, i) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="p-2 border">{i + 1}</td>
              <td className="p-2 border">{u.name || '—'}</td>
              <td className="p-2 border">{u.email || '—'}</td>
              <td className="p-2 border">{u.phone || '—'}</td>
              <td className="p-2 border">
                {u.roles.map(r => r.type).join(', ') || '—'}
              </td>
              <td className="p-2 border space-x-2 space-x-reverse">
                <button
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => alert(`تعديل المشرف المساعد ${u.name}`)}
                >
                  تعديل
                </button>
                <button
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={() => handleDelete(u.id)}
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CoSupervisorsTable;
