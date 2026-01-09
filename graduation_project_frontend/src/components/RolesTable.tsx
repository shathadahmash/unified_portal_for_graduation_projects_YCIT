import React, { useEffect, useState } from 'react';
import { userService, Role } from '../services/userService';
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';

const RolesTable: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoleName, setNewRoleName] = useState('');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Fetch roles
  const fetchRoles = async () => {
    setLoading(true);
    const data = await userService.getAllRoles();
    setRoles(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Create new role
  const handleCreate = async () => {
    const name = newRoleName.trim();
    if (!name) {
      setMessage({ type: 'error', text: 'الرجاء إدخال اسم الدور' });
      return;
    }
    // local duplicate check (case-insensitive)
    if (roles.some(r => r.type.toLowerCase() === name.toLowerCase())) {
      setMessage({ type: 'error', text: 'الدور موجود بالفعل' });
      return;
    }
    setIsCreating(true);
    try {
      await userService.createRole(name);
      setNewRoleName('');
      setMessage({ type: 'success', text: 'تم إنشاء الدور بنجاح' });
      await fetchRoles();
    } catch (err: any) {
      console.error('Failed to create role', err);
      const errMsg = err?.response?.data?.type || err?.response?.data?.detail || 'فشل إنشاء الدور';
      setMessage({ type: 'error', text: String(errMsg) });
    } finally {
      setIsCreating(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // Update role
  const handleUpdate = async () => {
    if (!editingRole || !editingName.trim()) return;
    try {
      await userService.updateRole(editingRole.id, { type: editingName });
      setEditingRole(null);
      setEditingName('');
      fetchRoles();
    } catch (err) {
      console.error('Failed to update role', err);
    }
  };

  // Delete role
  const handleDelete = async (roleId: number) => {
    if (!confirm('هل أنت متأكد أنك تريد حذف هذا الدور؟')) return;
    try {
      await userService.deleteRole(roleId);
      fetchRoles();
    } catch (err) {
      console.error('Failed to delete role', err);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading roles...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">إدارة الأدوار</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="دور جديد"
            className="border rounded px-2 py-1 text-sm"
            value={newRoleName}
            onChange={e => setNewRoleName(e.target.value)}
          />
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
          >
            <FiPlus /> إضافة
          </button>
        </div>
      </div>

      <table className="w-full table-auto border-collapse bg-white rounded-xl overflow-hidden shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-right">ID</th>
            <th className="px-4 py-2 text-right">الدور</th>
            <th className="px-4 py-2 text-center">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {roles.map(role => (
            <tr key={role.id} className="border-b hover:bg-gray-50 transition">
              <td className="px-4 py-2 text-right">{role.id}</td>
              <td className="px-4 py-2 text-right">
                {editingRole?.id === role.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                  />
                ) : (
                  role.type
                )}
              </td>
              <td className="px-4 py-2 text-center flex justify-center gap-2">
                {editingRole?.id === role.id ? (
                  <>
                    <button
                      onClick={handleUpdate}
                      className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-sm"
                    >
                      حفظ
                    </button>
                    <button
                      onClick={() => setEditingRole(null)}
                      className="bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400 text-sm"
                    >
                      إلغاء
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingRole(role);
                        setEditingName(role.type);
                      }}
                      className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500 text-sm flex items-center gap-1"
                    >
                      <FiEdit /> تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm flex items-center gap-1"
                    >
                      <FiTrash2 /> حذف
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {roles.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center py-4 text-gray-500">
                لا توجد أدوار حالياً
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RolesTable;
