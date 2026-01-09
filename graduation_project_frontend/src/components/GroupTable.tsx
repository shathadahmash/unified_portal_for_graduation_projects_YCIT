import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Student {
  student_id: number;
  full_name: string;
}

interface Group {
  group_id: number;
  group_name: string;
  project: { project_id: number; title: string } | null;
  students?: Student[]; // Added students
}

const GroupTable: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const [formData, setFormData] = useState({
    group_name: '',
    project_id: ''
  });

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await api.get('/groups/'); // Should include students in response
      setGroups(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const openAddModal = () => {
    setEditingGroup(null);
    setFormData({ group_name: '', project_id: '' });
    setShowModal(true);
  };

  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      group_name: group.group_name,
      project_id: group.project?.project_id.toString() || ''
    });
    setShowModal(true);
  };

  const deleteGroup = async (group_id: number) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;
    try {
      await api.delete(`/groups/${group_id}/`);
      setGroups(groups.filter((g) => g.group_id !== group_id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete group');
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingGroup) {
        const response = await api.put(`/groups/${editingGroup.group_id}/`, formData);
        setGroups(groups.map((g) => (g.group_id === editingGroup.group_id ? response.data : g)));
      } else {
        const response = await api.post('/groups/', formData);
        setGroups([...groups, response.data]);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save changes');
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.project?.title.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (g.students?.some(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ?? false)
  );

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (error) return <div className="text-center text-red-600 p-10">{error}</div>;

  return (
    <div className="p-6 bg-white min-h-screen rounded-lg shadow">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">إدارة المجموعات</h2>

      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search by group name, project, or student..."
          className="border px-3 py-2 rounded w-full md:w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={openAddModal}
          className="bg-blue-500 text-white px-4 py-2 rounded ml-4 hover:bg-blue-600 transition"
        >
          + Add Group
        </button>
      </div>

      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full table-fixed border-collapse text-center">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-3 border-b">ID</th>
              <th className="px-4 py-3 border-b">Group Name</th>
              <th className="px-4 py-3 border-b">Project</th>
              <th className="px-4 py-3 border-b">Students</th>
              <th className="px-4 py-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGroups.map((g) => (
              <tr key={g.group_id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{g.group_id}</td>
                <td className="px-4 py-2">{g.group_name}</td>
                <td className="px-4 py-2">{g.project?.title ?? '-'}</td>
                <td className="px-4 py-2">
                  {g.students?.map((s) => s.full_name).join(', ') ?? '-'}
                </td>
                <td className="px-4 py-2 flex justify-center gap-2">
                  <button
                    onClick={() => openEditModal(g)}
                    className="bg-yellow-200 hover:bg-yellow-300 text-gray-800 px-3 py-1 rounded transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteGroup(g.group_id)}
                    className="bg-red-200 hover:bg-red-300 text-gray-800 px-3 py-1 rounded transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {editingGroup ? 'Edit Group' : 'Add Group'}
            </h3>

            <input
              type="text"
              placeholder="Group Name"
              className="border w-full px-3 py-2 rounded mb-3"
              value={formData.group_name}
              onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Project ID"
              className="border w-full px-3 py-2 rounded mb-3"
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupTable;
