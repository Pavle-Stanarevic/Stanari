import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  withCredentials: true,
});

export const login = async (email, password) => {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
};

export default api;
