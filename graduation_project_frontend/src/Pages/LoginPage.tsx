import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useStore";
import api, { setAuthToken } from "../services/api";
import { FiAlertCircle, FiEye, FiEyeOff, FiUser } from "react-icons/fi";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1. إرسال طلب تسجيل الدخول
      const response = await api.post("auth/login/", { username, password });
      
      console.log("FULL LOGIN RESPONSE =", response.data);

      const { access, user } = response.data;

      // 2. التحقق من وجود التوكن وبيانات المستخدم (بدون تخمين)
      if (!access || !user) {
        throw new Error("لم يتم استلام بيانات تسجيل الدخول كاملة من الخادم");
      }

      // 3. حفظ التوكن سيقوم به useStore.login (يتعامل مع localStorage و Axios)

      // 4. تحويل بيانات المستخدم لتطابق هيكلية الـ Store (Normalized User)
      const normalizedUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        roles: user.roles || [],
        permissions: [],
        department_id: user.department_id,
        college_id: user.college_id,
      };

      console.log("USER =", user);
      console.log("ROLES =", user.roles);
      // 5. تنفيذ دالة الـ login لتحديث الحالة العالمية في التطبيق
      // login expects (user, roles[], token)
      login(normalizedUser, normalizedUser.roles || [], access);

      // 6. استخدام دالة navigateToDashboard المخصصة لديك للتوجيه
      // نمرر أول دور موجود في قائمة الأدوار
     const primaryRole =
  normalizedUser.roles[0]?.role__type ?? "";
console.log("PRIMARY ROLE =", primaryRole);
      
      if (primaryRole) {
        navigateToDashboard(primaryRole);
      } else {
        setError("هذا الحساب لا يملك صلاحيات وصول (Roles missing)");
      }

    } catch (err: any) {
      console.error("Login Error:", err.response?.data || err.message);
      setError(err.response?.data?.non_field_errors?.[0] || "فشل تسجيل الدخول، تأكد من البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToDashboard = (role: string) => {
    if (!role) return navigate("HomePage");
    const normalized = role.toLowerCase().trim();

  // ...existing code...
    const routePairs: [string, string][] = [
      ["student", "./dashboard/StudentDashboard"],
      ["co-supervisor", "/dashboard/co-supervisor"],
      ["supervisor", "/dashboard/supervisor"],
      ["department head", "/dashboard/department-head"],
      ["dean", "/dashboard/dean"],
      ["university president", "/dashboard/university-president"],
      ["system manager", "/dashboard/system-manager"],
      ["ministry", "/dashboard/ministry"],
      ["external company", "/dashboard/external-company"],
    ];

    for (const [key, path] of routePairs) {
      const re = new RegExp(`\\b${key.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
      if (re.test(normalized)) return navigate(path);
    }
// ...existing code...


    return navigate("homepage");
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-4"
      dir="rtl"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-10">
        <h1 className="text-3xl font-bold text-center text-slate-800">
          تسجيل الدخول
        </h1>
        <p className="text-center text-slate-500 mt-2">
          أدخل بيانات حسابك للمتابعة
        </p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 mt-6 rounded-lg p-4 flex gap-3 text-red-700">
            <FiAlertCircle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {/* Username */}
          <div>
            <label className="block text-right text-gray-700 mb-1">
              اسم المستخدم
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pr-4 pl-10 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 text-right"
                placeholder="أدخل اسم المستخدم"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-right text-gray-700 mb-1">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-4 pl-10 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 text-right"
                placeholder="أدخل كلمة المرور"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                disabled={isLoading}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isLoading ? "جاري التسجيل..." : "تسجيل الدخول"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          الدعم الفني: support@gpms.edu.ye
        </p>
        <p className="text-center text-xs text-gray-400 mt-1">
          © 2025 البوابة الموحدة لمشاريع التخرج
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
