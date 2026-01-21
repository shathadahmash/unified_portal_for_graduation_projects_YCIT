import React, { useState, useEffect } from 'react';
import SystemUsersTable from '../../components/UsersTable';
import api from '../../services/api';

const DepartmentUsersTable: React.FC = () => {
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('auth/me/');
        const dept = res.data?.department_id ?? null;
        setDepartmentId(dept);
      } catch (e) {
        console.error('[DepartmentUsersTable] fetch auth/me failed', e);
        setDepartmentId(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center">
        جالب بيانات القسم...
      </div>
    );
  }

  // Only show academic roles and restrict to department
  const academicRoles = ['Student', 'Supervisor', 'Co-supervisor'];

  return (
    <div dir="rtl">
      <SystemUsersTable onlyRoles={academicRoles} departmentId={departmentId} />
    </div>
  );
};

export default DepartmentUsersTable;
