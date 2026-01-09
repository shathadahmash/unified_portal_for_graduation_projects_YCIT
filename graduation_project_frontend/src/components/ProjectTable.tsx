import React, { useEffect, useState } from 'react';
import { projectService, Project } from '../services/projectService';
import { userService, User } from '../services/userService';
import { FiDownload } from 'react-icons/fi';

interface ProjectWithUsers extends Project {
  users?: User[]; // optional: users associated with this project
}

const ProjectsTable: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWithUsers[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const fetchedProjects = await projectService.getProject();
        
        // Optional: fetch users for each project (if available)
        // Here assuming each project has a users array or we map manually
        const projectsWithUsers: ProjectWithUsers[] = await Promise.all(
          fetchedProjects.map(async (proj: any) => {
            // Example: get all users and filter by project id if API allows
            // If your project API includes users directly, you can skip this
            const allUsers: User[] = await userService.getAllUsers();
            const projectUsers = allUsers.filter(u => u.roles.some(r => r.type === proj.type));
            return { ...proj, users: projectUsers };
          })
        );

        setProjects(projectsWithUsers);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading projects...</div>;

  if (projects.length === 0) return <div className="p-6 text-center">لا توجد مشاريع</div>;

  return (
    <div className="p-6 overflow-x-auto">
      <table className="min-w-full bg-white rounded-xl shadow">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-4 py-2 text-right">عنوان المشروع</th>
            <th className="px-4 py-2 text-right">نوع المشروع</th>
            <th className="px-4 py-2 text-right">الحالة</th>
            <th className="px-4 py-2 text-right">الملخص</th>
            <th className="px-4 py-2 text-right">المشرف</th>
            <th className="px-4 py-2 text-right">الكلية</th>
            <th className="px-4 py-2 text-right">السنة</th>
            <th className="px-4 py-2 text-right">المستخدمون</th>
            <th className="px-4 py-2 text-center">ملف المشروع</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((proj) => (
            <tr key={proj.project_id} className="border-b last:border-b-0">
              <td className="px-4 py-2 text-right">{proj.title}</td>
              <td className="px-4 py-2 text-right">{proj.type}</td>
              <td className="px-4 py-2 text-right">{proj.state}</td>
              <td className="px-4 py-2 text-right">{proj.description}</td>
              <td className="px-4 py-2 text-right">{proj.supervisor?.name || '-'}</td>
              <td className="px-4 py-2 text-right">{proj.college || '-'}</td>
              <td className="px-4 py-2 text-right">{proj.year || '-'}</td>
              <td className="px-4 py-2 text-right">
                {proj.users?.length ? proj.users.map(u => u.name).join(', ') : '-'}
              </td>
              <td className="px-4 py-2 text-center">
                <button
                  className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
                  onClick={() => projectService.downloadProjectFile(proj.project_id)}
                >
                  <FiDownload /> تنزيل
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectsTable;
