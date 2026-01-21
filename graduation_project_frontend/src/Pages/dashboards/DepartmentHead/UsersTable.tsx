import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiUserCheck, FiFilter } from 'react-icons/fi';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  roles: { role_ID: number; role_type: string; type: string }[];
}

interface UsersTableProps {
  roleFilter?: string;
  showRoleActions?: boolean;
}

const UsersTable: React.FC<UsersTableProps> = ({ roleFilter, showRoleActions }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = '/api/users/';
      if (roleFilter) {
        url += `?role_type=${roleFilter}`;
      }
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleUpdateRole = async (userId: number, newRole: string) => {
    setUpdatingId(userId);
    try {
      const response = await fetch(`/api/users/${userId}/update-role/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role_type: newRole })
      });
      if (response.ok) {
        alert('تم تحديث الدور بنجاح');
        fetchUsers();
      } else {
        const err = await response.json();
        alert(err.error || 'فشل تحديث الدور');
      }
    } catch (error) {
      alert('خطأ في الاتصال بالسيرفر');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="text-center py-10">جاري التحميل...</div>;

  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="p-4 font-black text-slate-600">الاسم</th>
            <th className="p-4 font-black text-slate-600">اسم المستخدم</th>
            <th className="p-4 font-black text-slate-600">الدور الحالي</th>
            {showRoleActions && <th className="p-4 font-black text-slate-600">تغيير الدور</th>}
            <th className="p-4 font-black text-slate-600">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? users.map((user) => (
            <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
              <td className="p-4 font-bold text-slate-800">{user.name || 'غير محدد'}</td>
              <td className="p-4 text-slate-600">{user.username}</td>
              <td className="p-4">
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                  {user.roles?.[0]?.type || 'بدون دور'}
                </span>
              </td>
              {showRoleActions && (
                <td className="p-4">
                  <select 
                    disabled={updatingId === user.id}
                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={user.roles?.[0]?.type}
                  >
                    <option value="Student">طالب</option>
                    <option value="Supervisor">مشرف</option>
                    <option value="Co-supervisor">مشرف مساعد</option>
                  </select>
                </td>
              )}
              <td className="p-4">
                <div className="flex gap-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><FiEdit2 size={18} /></button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 size={18} /></button>
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={showRoleActions ? 5 : 4} className="p-10 text-center text-slate-400">لا يوجد مستخدمون مطابقون</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;
