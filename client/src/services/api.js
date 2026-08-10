import axios from "axios";

const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            return "http://localhost:5000/api";
        }
        // In production/phone access, use relative /api route or Vercel API
        return "/api";
    }
    return "http://localhost:5000/api";
};

const API = axios.create({
    baseURL: getBaseURL()
});

// Request Interceptor to dynamically attach the Bearer token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("tms_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor to catch 401 (Unauthorized/Expired) and trigger redirect
API.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.status === 401) {
        console.warn("Session expired or unauthorized. Clearing token and redirecting...");
        localStorage.removeItem("tms_token");
        localStorage.removeItem("tms_user");
        localStorage.removeItem("tms_org_id");
        // Force reload page to trigger App.jsx login redirect guard
        window.location.reload();
    }
    return Promise.reject(error);
});

export default API;