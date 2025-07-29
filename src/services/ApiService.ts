import axios, { AxiosRequestConfig } from "axios";
import store, { persistor } from "@/store"; // ← si usás redux-persist

const BASE_URL = "http://127.0.0.1:8000/api";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("🔐 Token inválido o expirado, redirigiendo al login...");

      localStorage.removeItem("token");
      if (persistor?.purge) {
        persistor.purge();
      }

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

const ApiService = {
  async fetchData<T = any>(options: AxiosRequestConfig): Promise<{ data: T }> {
    const state = store.getState();
    const token = state.auth?.access ?? localStorage.getItem("token");

    const headers = {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await axios({
      baseURL: BASE_URL,
      ...options,
      headers,
    });

    return { data: response.data };
  },
};

export default ApiService;
