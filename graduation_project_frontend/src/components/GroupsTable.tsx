import React, { useEffect, useState } from 'react';
import { groupService } from '../services/groupService';
import { projectService } from '../services/projectService';

interface Group {
  id: number;
  group_name: string;
  project?: number | null;
  students?: { id: number; name: string }[];
  supervisors?: { id: number; name: string }[];
  co_supervisors?: { id: number; name: string }[];
  note?: string;
}

const GroupsTable: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [projectsMap, setProjectsMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ==========================
     Fetch Groups + Projects
  ========================== */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [groupsData, projectsData] = await Promise.all([
          groupService.getGroups(),
          projectService.getProject()
        ]);

        // تأمين البيانات القادمة
        setGroups(Array.isArray(groupsData) ? groupsData : []);

        // Map المشاريع (project_id => title)
        const map: Record<number, string> = {};
        (projectsData || []).forEach((p: any) => {
          if (p?.project_id) {
            map[p.project_id] = p.title;
          }
        });
        setProjectsMap(map);
      } catch (err) {
        console.error(err);
        setError('فشل تحميل بيانات المجموعات');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ==========================
     Delete Group (Soft delete)
  ========================== */
  const handleDelete = async (groupId: number) => {
    const confirmDelete = window.confirm('هل أنت متأكد من حذف هذه المجموعة؟');
    if (!confirmDelete) return;

    try {
      await groupService.updateGroup(groupId, { is_deleted: true });
      setGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (err) {
      alert('فشل حذف المجموعة');
    }
  };

  /* ==========================
     UI States
  ========================== */
  if (loading) {
    return <div className="p-4 text-center">جاري تحميل المجموعات...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">{error}</div>;
  }

  if (groups.length === 0) {
    return <div className="p-4 text-center text-gray-500">لا توجد مجموعات</div>;
  }

  /* ==========================
     Render Table
  ========================== */
  return (
    <div className="p-4 overflow-x-auto">
      <table className="w-full border border-gray-200 rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">#</th>
            <th className="p-2 border">اسم المجموعة</th>
            <th className="p-2 border">المشروع</th>
            <th className="p-2 border">الطلاب</th>
            <th className="p-2 border">المشرفون</th>
            <th className="p-2 border">المشرفون المساعدون</th>
            <th className="p-2 border">ملاحظات</th>
            <th className="p-2 border">الإجراءات</th>
          </tr>
        </thead>

        <tbody>
          {groups.map(group => (
            <tr key={group.id} className="hover:bg-gray-50">
              <td className="p-2 border text-center">{group.id}</td>

              <td className="p-2 border font-semibold">
                {group.group_name || '—'}
              </td>

              <td className="p-2 border">
                {group.project
                  ? projectsMap[group.project] || 'غير مرتبط'
                  : '—'}
              </td>

              <td className="p-2 border">
                {(group.students ?? [])
                  .map(s => s.name)
                  .join(', ') || '—'}
              </td>

              <td className="p-2 border">
                {(group.supervisors ?? [])
                  .map(s => s.name)
                  .join(', ') || '—'}
              </td>

              <td className="p-2 border">
                {(group.co_supervisors ?? [])
                  .map(s => s.name)
                  .join(', ') || '—'}
              </td>

              <td className="p-2 border">
                {group.note || '—'}
              </td>

              <td className="p-2 border text-center space-x-2 space-x-reverse">
                <button
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => alert(`Edit group ${group.id}`)}
                >
                  تعديل
                </button>

                <button
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={() => handleDelete(group.id)}
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

export default GroupsTable;
