import React, { useEffect, useState } from 'react';
import { userService, User } from '../services/userService';

const SupervisorsTable: React.FC = () => {
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<{ id: number; type: string }[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState({ username: '', name: '', email: '', phone: '', password: '' });
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        setLoading(true);
        const allUsers = await userService.getAllUsers();
        // فلتر فقط المشرفين (استبعاد المشرفين المساعدين)
        const normalize = (s: string) => (s || '').toString().toLowerCase().replace(/[_-]/g, ' ').trim();

        const isSupervisorRole = (roleType: string) => {
          const t = normalize(roleType);
          if (!t.includes('supervisor')) return false;
          // استبعد أي دور يحتوي على "co" كرمز منفصل أو صيغ co-supervisor
          if (/(^|\s)co(\s|$)/.test(t) || t.includes('co supervisor') || t.includes('cosupervisor')) return false;
          return true;
        };

        const filtered = allUsers.filter(u => u.roles.some(r => isSupervisorRole(r.type)));
        setSupervisors(filtered);
        // also keep all users for modal
        setAllUsers(allUsers);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSupervisors();
  }, []);

  const openModal = async () => {
    try {
      const us = await userService.getAllUsers();
      const rs = await userService.getAllRoles();
      setAllUsers(us);
      setRoles(rs);
      // pick supervisor role if exists
      const normalizeRole = (s: string) => (s || '').toString().toLowerCase().replace(/[_-]/g, ' ').trim();
      const supervisorRole = rs.find(r => normalizeRole(r.type) === 'supervisor') || rs.find(r => normalizeRole(r.type).includes('supervisor') && !/(^|\s)co(\s|$)/.test(normalizeRole(r.type)));
      setSelectedRoleId(supervisorRole ? supervisorRole.id : (rs[0] && rs[0].id) || null);
      setSelectedUserId(null);
      setCreatingNew(false);
      setForm({ username: '', name: '', email: '', phone: '', password: '' });
      setShowModal(true);
    } catch (err) {
      console.error('Failed to open modal', err);
      alert('فشل جلب البيانات');
    }
  };

  const closeModal = () => setShowModal(false);

  const submitModal = async () => {
    try {
      setIsCreating(true);
      let userId = selectedUserId;
      if (creatingNew) {
        // basic validation: username required
        if (!form.username || form.username.trim() === '') {
          alert('يرجى إدخال اسم مستخدم صالح');
          setIsCreating(false);
          return;
        }
        // create user (include password if provided)
        const createPayload: any = { username: form.username, name: form.name, email: form.email, phone: form.phone };
        if (form.password && form.password.trim() !== '') createPayload.password = form.password;
        const newUser = await userService.createUser(createPayload as any);
        userId = newUser.id;
      }
      if (!userId) throw new Error('No user selected or created');
      if (!selectedRoleId) throw new Error('No role selected');
      await userService.assignRoleToUser(userId, selectedRoleId);
      // refresh supervisors list
      const us = await userService.getAllUsers();
      const normalize = (s: string) => (s || '').toString().toLowerCase().replace(/[_-]/g, ' ').trim();
      const isSupervisorRole = (roleType: string) => {
        const t = normalize(roleType);
        if (!t.includes('supervisor')) return false;
        if (/(^|\s)co(\s|$)/.test(t) || t.includes('co supervisor') || t.includes('cosupervisor')) return false;
        return true;
      };
      const filtered = us.filter(u => u.roles.some(r => isSupervisorRole(r.type)));
      setSupervisors(filtered);
      setShowModal(false);
    } catch (err: any) {
      console.error('Failed submit', err);
      alert(err?.response?.data?.detail || err.message || 'فشل الإضافة');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المشرف؟')) return;
    try {
      await userService.deleteUser(userId);
      setSupervisors(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert('فشل حذف المشرف');
    }
  };

  const handleCreate = async () => {
    // open modal and preload roles/users so default role becomes Supervisor
    await openModal();
  };

  const handleEdit = async (user: User) => {
    try {
      const us = await userService.getAllUsers();
      const rs = await userService.getAllRoles();
      setAllUsers(us);
      setRoles(rs);
      // prefill form with user data
      setSelectedUserId(user.id);
      setCreatingNew(false);
      setForm({ username: user.username, name: user.name || '', email: user.email || '', phone: user.phone || '', password: '' });
      // choose a supervisor role id if user has one, otherwise pick default supervisor role
      const normalizeRole = (s: string) => (s || '').toString().toLowerCase().replace(/[_-]/g, ' ').trim();
      const isSupervisorType = (t: string) => {
        const n = normalizeRole(t);
        if (!n.includes('supervisor')) return false;
        if (/(^|\s)co(\s|$)/.test(n) || n.includes('co supervisor') || n.includes('cosupervisor')) return false;
        return true;
      };
      const userSupervisorRole = (user.roles || []).find(r => isSupervisorType(r.type));
      if (userSupervisorRole) {
        setSelectedRoleId(userSupervisorRole.id);
      } else {
        const supervisorRole = rs.find(r => normalizeRole(r.type) === 'supervisor') || rs.find(r => normalizeRole(r.type).includes('supervisor') && !/(^|\s)co(\s|$)/.test(normalizeRole(r.type)));
        setSelectedRoleId(supervisorRole ? supervisorRole.id : (rs[0] && rs[0].id) || null);
      }
      setShowModal(true);
    } catch (err) {
      console.error('Failed to open edit modal', err);
      alert('فشل جلب بيانات التعديل');
    }
  };

  if (loading) return <div className="p-4 text-center">جاري تحميل المشرفين...</div>;

  if (supervisors.length === 0) return <div className="p-4 text-center text-gray-500">لا يوجد مشرفون</div>;
  return (
    <div className="p-4 overflow-x-auto bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">المشرفين</h3>
        <div>
          <button
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            onClick={handleCreate}
          >
            إضافة مشرف
          </button>
        </div>
      </div>
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
          {supervisors.map((u, i) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="p-2 border">{i + 1}</td>
              <td className="p-2 border">{u.name || '—'}</td>
              <td className="p-2 border">{u.email || '—'}</td>
              <td className="p-2 border">{u.phone || '—'}</td>
              <td className="p-2 border">
                {u.roles.map(r => r.type).join(', ') || '—'}
              </td>
              <td className="p-2 border">
                <div className="flex items-center justify-center gap-2">
                  <button
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => handleEdit(u)}
                  >
                    تعديل
                  </button>
                  <button
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={() => handleDelete(u.id)}
                  >
                    حذف
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40 z-40" onClick={closeModal} />
          <div className="bg-white rounded-lg shadow-lg z-50 w-full max-w-xl p-6">
            <h3 className="text-lg font-semibold mb-4">إضافة/اختيار مشرف</h3>

            <div className="mb-3">
              <label className="block mb-1">اختيار مستخدم موجود</label>
              <select className="w-full border p-2 rounded" value={selectedUserId ?? ''} onChange={e => { setSelectedUserId(e.target.value ? Number(e.target.value) : null); setCreatingNew(false); }}>
                <option value="">-- اختر مستخدماً --</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.username} ({u.email || '—'})</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={creatingNew} onChange={e => { setCreatingNew(e.target.checked); if (e.target.checked) setSelectedUserId(null); }} />
                إنشاء مستخدم جديد
              </label>
            </div>

            {creatingNew && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input className="border p-2 rounded" placeholder="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                <input className="border p-2 rounded" placeholder="الاسم الكامل" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <input className="border p-2 rounded" placeholder="البريد الإلكتروني" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <input className="border p-2 rounded" placeholder="الهاتف" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <input type="password" className="border p-2 rounded" placeholder="كلمة المرور" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
            )}

            <div className="mb-4">
              <label className="block mb-1">دور</label>
              <select className="w-full border p-2 rounded" value={selectedRoleId ?? ''} onChange={e => setSelectedRoleId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">-- اختر دوراً --</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.type}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={closeModal} disabled={isCreating}>إلغاء</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={submitModal} disabled={isCreating}>{isCreating ? 'جاري الحفظ...' : 'حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorsTable;
