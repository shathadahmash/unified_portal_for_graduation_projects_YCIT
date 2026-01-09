import api from './api';

export interface Project {
  project_id?: number; // optional when creating
  title: string;
  type: string; // must match backend choices
  state?: string;
  description: string;
  start_date: string; // required, format: YYYY-MM-DD
  supervisor?: { name: string; id: number };
  supervisor_id?: number; // if backend expects an ID
  college?: string;
  year?: string;
  logo?: string;
}

export const projectService = {
  async getProjects(params?: any) {
    try {
      const response = await api.get('/projects/', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      return [];
    }
  },

  async getProject() {
    try {
      const response = await api.get('/projects/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      return [];
    }
  },

  async getProjectById(projectId: number) {
    try {
      const response = await api.get(`/projects/${projectId}/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch project:', error);
      throw error;
    }
  },

  async getFilterOptions() {
    try {
      const response = await api.get('/projects/filter-options/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
      return { colleges: [], supervisors: [], years: [] };
    }
  },

  async searchProjects(query: string, params?: any) {
    try {
      const response = await api.get('/projects/search/', {
        params: { q: query, ...params },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search projects:', error);
      return [];
    }
  },

  async proposeProject(payload: Project) {
    try {
      // Ensure required fields are present
      if (!payload.start_date) {
        throw new Error('start_date is required (YYYY-MM-DD)');
      }
      if (!payload.type) {
        throw new Error('type is required');
      }

      const response = await api.post('/projects/', payload);
      return response.data;
    } catch (error) {
      console.error('Failed to propose project:', error);
      throw error;
    }
  },

  async updateProject(projectId: number, payload: Partial<Project>) {
    try {
      const response = await api.patch(`/projects/${projectId}/update_project/`, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  },

  async deleteProject(projectId: number) {
    try {
      const response = await api.delete(`/projects/${projectId}/delete_project/`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  },

  async downloadProjectFile(projectId: number) {
    try {
      const response = await api.get(`/projects/${projectId}/download-file/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project_${projectId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      throw error;
    }
  },
};
