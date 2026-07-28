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

export default API;