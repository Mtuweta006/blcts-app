import React, { useState, useEffect } from "react";
import { UserCog, Plus, Trash2, CreditCard as Edit3, X, ShieldCheck, Mail, Phone, Briefcase } from "lucide-react";
import { User, UserRole, ADMIN_ROLES, FM_ROLES } from "../types";
import { countyList, countyCities } from "../data/regionalPricing";

interface UserManagementProps {
  currentUser: User | null;
  triggerToast: (msg: string, type?: "success" | "info" | "warning") => void;
}

interface StoredUser extends User {
  passwordHash?: string;
}

const allRoles: UserRole[] = ["Developer", "Super Admin", "Executive", "Finance Officer", "Auditor", "Facility Manager", "Maintenance Engineer", "Property Manager", "Vendor"];

export default function UserManagement({ currentUser, triggerToast }: UserManagementProps) {
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StoredUser | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Facility Manager" as UserRole,
    organization: "",
    phone: "",
    scopeProperties: [] as string[],
    password: ""
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    try {
      const stored = localStorage.getItem("blcts-users");
      if (stored) setUsers(JSON.parse(stored));
    } catch (e) {}
  };

  const saveUsers = (updated: StoredUser[]) => {
    setUsers(updated);
    try {
      localStorage.setItem("blcts-users", JSON.stringify(updated));
    } catch (e) {}
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      triggerToast("Name and email are required.", "warning");
      return;
    }

    if (users.some(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
      triggerToast("A user with this email already exists.", "warning");
      return;
    }

    const hashPassword = async (pwd: string): Promise<string> => {
      const msgBuffer = new TextEncoder().encode(pwd);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
    };

    const defaultPwd = formData.password || "defaultPass123";
    hashPassword(defaultPwd).then(passwordHash => {
      const newUser: StoredUser = {
        id: `user-${Date.now()}`,
        name: formData.name,
        email: formData.email.toLowerCase().trim(),
        role: formData.role,
        organization: formData.organization || "Unassigned",
        phone: formData.phone || "+254 700 000 000",
        scopeProperties: formData.scopeProperties,
        passwordHash
      };

      saveUsers([...users, newUser]);
      setIsAddModalOpen(false);
      resetForm();
      triggerToast(`User "${newUser.name}" created successfully as ${newUser.role}.`, "success");
    });
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!formData.name || !formData.email) {
      triggerToast("Name and email are required.", "warning");
      return;
    }

    const updated = users.map(u => u.id === editingUser.id ? {
      ...u,
      name: formData.name,
      email: formData.email.toLowerCase().trim(),
      role: formData.role,
      organization: formData.organization,
      phone: formData.phone,
      scopeProperties: formData.scopeProperties
    } : u);

    saveUsers(updated);
    setEditingUser(null);
    resetForm();
    triggerToast(`User "${formData.name}" updated successfully.`, "success");
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (id === currentUser?.id) {
      triggerToast("You cannot delete your own account while logged in.", "warning");
      return;
    }
    saveUsers(users.filter(u => u.id !== id));
    triggerToast(`User "${name}" deleted.`, "info");
  };

  const startEdit = (user: StoredUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization || "",
      phone: user.phone || "",
      scopeProperties: user.scopeProperties || [],
      password: ""
    });
    setIsAddModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "Facility Manager",
      organization: "",
      phone: "",
      scopeProperties: [],
      password: ""
    });
  };

  const openAddModal = () => {
    setEditingUser(null);
    resetForm();
    setIsAddModalOpen(true);
  };

  const isFmRole = (role: UserRole) => FM_ROLES.includes(role);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <UserCog className="w-5 h-5 text-indigo-400" />
            User Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, edit, and manage user accounts with role-based access control.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Scope</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
              {users.map(u => {
                const isAdmin = ADMIN_ROLES.includes(u.role);
                return (
                  <tr key={u.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{u.name}</span>
                          <span className="text-[10px] text-slate-400 block">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                        isAdmin ? "bg-emerald-950 text-emerald-400" : "bg-sky-950 text-sky-400"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{u.organization || "—"}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-[10px]">{u.phone || "—"}</td>
                    <td className="py-3.5 px-4">
                      {u.scopeProperties && u.scopeProperties.length > 0 ? (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{u.scopeProperties.length} counties</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">All</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => startEdit(u)}
                          className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit User"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">No users found. Click "Add User" to create one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {editingUser ? "Edit User" : "Create New User"}
              </h3>
              <button onClick={() => { setIsAddModalOpen(false); setEditingUser(null); }} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={editingUser ? handleEditUser : handleAddUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. John Mwangi"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. user@blcts.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Role *</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Organization</label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={e => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Wandera Investments Ltd"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="+254 712 345 678"
                />
              </div>

              {/* Scope Properties for FM roles */}
              {isFmRole(formData.role) && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    Assigned Counties (Scope)
                  </label>
                  <p className="text-[10px] text-slate-400 font-light">Select counties this facility manager can access.</p>
                  <div className="max-h-32 overflow-y-auto bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-2 space-y-1">
                    {countyList.map(c => (
                      <label key={c} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 p-1.5 rounded">
                        <input
                          type="checkbox"
                          checked={formData.scopeProperties.includes(c)}
                          onChange={e => {
                            if (e.target.checked) {
                              setFormData({ ...formData, scopeProperties: [...formData.scopeProperties, c] });
                            } else {
                              setFormData({ ...formData, scopeProperties: formData.scopeProperties.filter(s => s !== c) });
                            }
                          }}
                          className="accent-emerald-500"
                        />
                        {c}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {!editingUser && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="Default: defaultPass123"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-md cursor-pointer"
              >
                {editingUser ? "Save Changes" : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
