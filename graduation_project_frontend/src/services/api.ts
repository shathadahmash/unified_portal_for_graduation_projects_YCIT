
// export default api;
import axios from "axios";

/* =======================
   Axios Instance
======================= */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

/* =======================
   Load Token on Startup
======================= */
// Support both `token` and `access_token` keys (some parts of the app use different names)
const savedToken = localStorage.getItem("token") || localStorage.getItem("access_token");
if (savedToken) {
  api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
}

/* =======================
   Auth Token Helper
======================= */
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

export function persistAuthToken(token: string | null) {
  // Keep localStorage keys in sync so different modules find the token
  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('access_token', token);
    setAuthToken(token);
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    setAuthToken(null);
  }
}

// Attach response interceptor for better debug output on errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    try {
      const resp = err.response;
      if (resp) {
        console.error('[API ERROR]', resp.status, resp.config.method?.toUpperCase(), resp.config.url, resp.data);
        if (resp.status === 500) {
          // show a concise message so the user can copy-paste server error
          const msg = resp.data && typeof resp.data === 'object' ? JSON.stringify(resp.data) : String(resp.data);
          // eslint-disable-next-line no-alert
          alert(`Server Error 500: ${msg}`);
        }
      } else {
        console.error('[API ERROR] no response', err);
      }
    } catch (e) {
      console.error('Error handling API error', e);
    }
    return Promise.reject(err);
  }
);

/* =======================
   API ENDPOINTS
======================= */
export const API_ENDPOINTS = {
  LOGIN: "auth/login/",
  ME: "auth/me/",
  STUDENTS: "students/",
  SUPERVISORS: "supervisors/",
  CO_SUPERVISORS: "co-supervisors/",
  STATISTICS: "statistics/",
  PROGRAMS: "programs/", // <- add this
};

/* =======================
   ROLES
======================= */
export const ROLES = {
  STUDENT: "student",
  SUPERVISOR: "supervisor",
  CO_SUPERVISOR: "co-supervisor",
  DEAN: "dean",
  DEPARTMENT_HEAD: "department head",
  SYSTEM_MANAGER: "system manager",
  EXTERNAL_COMPANY: "external_company",
};

/* =======================
   Default Export
======================= */
export default api;
