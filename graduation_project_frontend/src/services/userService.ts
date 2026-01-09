import api from "./api";

/* ==========================
   Types
========================== */

export interface Role {
  id: number;
  type: string;
}

export interface Permission {
  id: number;
  name: string;
  description?: string | null;
}

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone?: string | null;
  gender?: string | null;
  roles: Role[];
  permissions?: Permission[];
}

/* ==========================
   Normalizers
========================== */

const normalizeRoles = (roles: any[] = []): Role[] =>
  roles.map((r) => ({
    id: r.id ?? r.role_ID ?? r.role__role_ID,
    type: r.type ?? r.role__type,
  }));

const normalizeUser = (user: any): User => ({
  ...user,
  roles: normalizeRoles(user.roles),
});

/* ==========================
   Service
========================== */

export const userService = {
  /* ---------- ROLES ---------- */
  
  async getAllRoles(): Promise<Role[]> {
    const response = await api.get("/roles/");
    return response.data.map((r: any) => ({
      id: r.id ?? r.role_ID,
      type: r.type,
    }));
  },

  async createRole(type: string): Promise<Role> {
    const response = await api.post('/roles/', { type });
    const r = response.data;
    return { id: r.id ?? r.role_ID, type: r.type };
  },

  async updateRole(roleId: number, data: Partial<Role>): Promise<Role> {
    const payload: any = {};
    if (data.type !== undefined) payload.type = data.type;
    const response = await api.patch(`/roles/${roleId}/`, payload);
    const r = response.data;
    return { id: r.id ?? r.role_ID, type: r.type };
  },

  async deleteRole(roleId: number): Promise<void> {
    await api.delete(`/roles/${roleId}/`);
  },

  /* ---------- USERS ---------- */

  async getAllUsers(): Promise<User[]> {
    const response = await api.get("/users/");
    return response.data.map(normalizeUser);
  },

  async getUserById(userId: number): Promise<User> {
    const response = await api.get(`/users/${userId}/`);
    return normalizeUser(response.data);
  },

  /* ---------- DROPDOWN ---------- */

  async getUsersForDropdown(): Promise<{ id: number; name: string }[]> {
    const response = await api.get("/dropdown-data/");
    return [
      ...(response.data.students || []),
      ...(response.data.supervisors || []),
      ...(response.data.assistants || []),
    ];
  },

  /* ---------- CRUD ---------- */

  async createUser(data: Partial<User>): Promise<User> {
    const response = await api.post("/users/", data);
    return normalizeUser(response.data);
  },

  async updateUser(userId: number, data: Partial<User>): Promise<User> {
    // Only send writable fields expected by the backend UserSerializer
    const payload: any = {};
    if (data.username !== undefined) payload.username = data.username;
    if (data.name !== undefined) payload.name = data.name;
    if (data.email !== undefined) payload.email = data.email;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.gender !== undefined) payload.gender = data.gender;

    // Use PATCH for partial updates
    const response = await api.patch(`/users/${userId}/`, payload);
    return normalizeUser(response.data);
  },

  async deleteUser(userId: number): Promise<void> {
    await api.delete(`/users/${userId}/`);
  },

  /* ---------- USER ROLES ---------- */

  async assignRoleToUser(userId: number, roleId: number): Promise<void> {
    // send both key variants to be compatible with backend (accepts user/user_id and role/role_id)
    await api.post("/user-roles/", {
      user: userId,
      role: roleId,
      user_id: userId,
      role_id: roleId,
    });
  },

  async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    await api.delete(`/user-roles/?user_id=${userId}&role_id=${roleId}`);
  },
};