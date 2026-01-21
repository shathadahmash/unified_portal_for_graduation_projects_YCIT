import api from './api';
import { userService } from './userService';
import { groupService } from './groupService';
import { projectService } from './projectService';

const departmentHeadService = {
  async getStudentsByDepartment(departmentId: number) {
    if (departmentId == null) return [];
    try {
      // prefer groupService endpoint if available
      if (typeof (groupService as any).getStudents === 'function') {
        return await (groupService as any).getStudents(departmentId);
      }

      // fallback: fetch all users and filter
      const all = await userService.getAllUsers();
      return all.filter((u: any) => String(u.department_id) === String(departmentId) && (u.roles || []).some((r: any) => /student/i.test(r.type)));
    } catch (err) {
      console.error('[departmentHeadService] getStudentsByDepartment error', err);
      return [];
    }
  },

  async getSupervisorsByDepartment(departmentId: number) {
    if (departmentId == null) return [];
    try {
      // try to use dropdown API if exists
      if (typeof (groupService as any).getDropdownData === 'function') {
        const dd = await (groupService as any).getDropdownData();
        const sups = (dd.supervisors || []).concat(dd.assistants || []);
        return sups.filter((s: any) => String(s.department_id || s.department) === String(departmentId));
      }

      const all = await userService.getAllUsers();
      return all.filter((u: any) => String(u.department_id) === String(departmentId) && (u.roles || []).some((r: any) => /supervisor|co[- ]?supervisor|assistant/i.test(r.type)));
    } catch (err) {
      console.error('[departmentHeadService] getSupervisorsByDepartment error', err);
      return [];
    }
  },

  async getProjectsByDepartment(departmentId: number) {
    if (departmentId == null) return [];
    try {
      // use projectService with params if available
      try {
        const resp = await projectService.getProjects({ department_id: departmentId });
        const rows = Array.isArray(resp) ? resp : (resp.results || []);
        return rows.filter((p: any) => String(p.department_id || p.college || '') === String(departmentId));
      } catch (err) {
        console.warn('[departmentHeadService] projectService.getProjects failed, falling back', err);
      }

      const all = await projectService.getProject();
      return (Array.isArray(all) ? all : []).filter((p: any) => String(p.department_id || p.college || '') === String(departmentId));
    } catch (err) {
      console.error('[departmentHeadService] getProjectsByDepartment error', err);
      return [];
    }
  },

  async createGroupForDepartment(payload: any) {
    // ensure department_id exists
    if (!payload.department_id) {
      throw new Error('department_id required to create group for department');
    }
    return await groupService.createGroupForApproval(payload);
  }
};

export default departmentHeadService;
