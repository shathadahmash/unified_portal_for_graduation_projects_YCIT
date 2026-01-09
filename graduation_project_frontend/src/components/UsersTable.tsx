import React, { useEffect, useState } from "react";
import { userService, User, Role } from "../services/userService";

interface NewUser {
  username: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  gender?: string;
  roleId?: number;
}

const UsersTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    username: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    gender: "",
    roleId: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<(User & { roleId?: number }) | null>(null);

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  const fetchRoles = async () => {
    try {
      const allRoles = await userService.getAllRoles();
      setRoles(allRoles);
    } catch (err) {
      console.error("❌ Error fetching roles:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error("❌ Error fetching users:", err);
    }
  };

  const handleCreateUser = async () => {
    const { username, name, email, password, roleId } = newUser;
    if (!username || !name || !email || !password) {
      alert("Please fill all required fields!");
      return;
    }

    try {
      setLoading(true);
      
      // Payload for user creation
      const payload = {
        username,
        name,
        email,
        password,
        phone: newUser.phone || null,
        gender: newUser.gender || null,
      };

      // 1. Create the user
      const createdUser = await userService.createUser(payload as any);

      // 2. Assign role if selected
      if (roleId) {
        await userService.assignRoleToUser(createdUser.id, roleId);
      }

      setNewUser({ username: "", name: "", email: "", password: "", phone: "", gender: "", roleId: undefined });
      setShowCreateForm(false);
      fetchUsers();
    } catch (err: any) {
      console.error("❌ Error creating user:", err);
      if (err.response?.status === 405) {
        alert("Error 405: Method Not Allowed. This is likely due to a conflict in your backend urls.py. Please remove 'path(\"users/\", get_all_users)' to allow the router to handle POST requests.");
      } else {
        alert(`Failed to create user: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      setLoading(true);

      const updatedData = {
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone || null,
        gender: editingUser.gender || null,
      };
      
      // 1. Update user info
      await userService.updateUser(editingUser.id, updatedData);

      // 2. Update role if changed
      const currentRoleId = editingUser.roles[0]?.id;
      const newRoleId = editingUser.roleId;

      if (newRoleId && newRoleId !== currentRoleId) {
        if (currentRoleId) {
          await userService.removeRoleFromUser(editingUser.id, currentRoleId);
        }
        await userService.assignRoleToUser(editingUser.id, newRoleId);
      }

      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error("❌ Error updating user:", err);
      alert(`Failed to update user: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await userService.deleteUser(userId);
      fetchUsers();
    } catch (err) {
      console.error(`❌ Error deleting user ${userId}:`, err);
    }
  };

  const startEditing = (user: User) => {
    setShowCreateForm(false); // Auto-close create form
    setEditingUser({
      ...user,
      roleId: user.roles[0]?.id,
    });
  };

  const toggleCreateForm = () => {
    setEditingUser(null); // Auto-close edit form
    setShowCreateForm(!showCreateForm);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Users Management</h1>

      <button
        onClick={toggleCreateForm}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
      >
        {showCreateForm ? "Hide Form" : "New User"}
      </button>

      {showCreateForm && (
        <div className="mb-6 p-4 bg-white rounded shadow-md max-w-md">
          <h2 className="text-xl font-semibold mb-3">Create New User</h2>
          <div className="flex flex-col gap-2">
            <input type="text" placeholder="Username" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} className="border px-3 py-2 rounded w-full" />
            <input type="text" placeholder="Full Name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="border px-3 py-2 rounded w-full" />
            <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="border px-3 py-2 rounded w-full" />
            <input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="border px-3 py-2 rounded w-full" />
            <input type="text" placeholder="Phone" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} className="border px-3 py-2 rounded w-full" />
            <select value={newUser.gender} onChange={e => setNewUser({ ...newUser, gender: e.target.value })} className="border px-3 py-2 rounded w-full">
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <select 
              value={newUser.roleId || ""} 
              onChange={e => setNewUser({ ...newUser, roleId: Number(e.target.value) })} 
              className="border px-3 py-2 rounded w-full"
            >
              <option value="">Select Role</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.type}</option>
              ))}
            </select>
            <button onClick={handleCreateUser} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-2" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="mb-6 p-4 bg-white rounded shadow-md max-w-md">
          <h2 className="text-xl font-semibold mb-3">Update User</h2>
          <div className="flex flex-col gap-2">
            <input type="text" placeholder="Full Name" value={editingUser.name || ""} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} className="border px-3 py-2 rounded w-full" />
            <input type="email" placeholder="Email" value={editingUser.email || ""} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} className="border px-3 py-2 rounded w-full" />
            <input type="text" placeholder="Phone" value={editingUser.phone || ""} onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })} className="border px-3 py-2 rounded w-full" />
            <select value={editingUser.gender || ""} onChange={e => setEditingUser({ ...editingUser, gender: e.target.value })} className="border px-3 py-2 rounded w-full">
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <select
              value={editingUser.roleId || ""}
              onChange={e => setEditingUser({ ...editingUser, roleId: Number(e.target.value) })}
              className="border px-3 py-2 rounded w-full"
            >
              <option value="" disabled>Select Role</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.type}</option>
              ))}
            </select>
            <button onClick={handleUpdateUser} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-2" disabled={loading}>
              {loading ? "Updating..." : "Update User"}
            </button>
            <button onClick={() => setEditingUser(null)} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 mt-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded shadow-md">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-200 text-gray-700 uppercase text-sm">
            <tr>
              <th className="px-4 py-2 border-b">ID</th>
              <th className="px-4 py-2 border-b">Username</th>
              <th className="px-4 py-2 border-b">Name</th>
              <th className="px-4 py-2 border-b">Email</th>
              <th className="px-4 py-2 border-b">Phone</th>
              <th className="px-4 py-2 border-b">Role</th>
              <th className="px-4 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-100 transition-colors">
                <td className="px-4 py-3 border-b">{user.id}</td>
                <td className="px-4 py-3 border-b">{user.username}</td>
                <td className="px-4 py-3 border-b">{user.name}</td>
                <td className="px-4 py-3 border-b">{user.email}</td>
                <td className="px-4 py-3 border-b">{user.phone || "N/A"}</td>
                <td className="px-4 py-3 border-b">
                  <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-sm">
                    {user.roles[0]?.type || "No role"}
                  </span>
                </td>
                <td className="px-4 py-3 border-b flex gap-2">
                  <button onClick={() => startEditing(user)} className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteUser(user.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;