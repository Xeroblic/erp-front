import axios, { AxiosRequestConfig } from "axios";
import store from "@/store"; // si tienes acceso al store

const BASE_URL = "http://127.0.0.1:8000/api";

const ApiService = {
  async fetchData<T = any>(options: AxiosRequestConfig): Promise<{ data: T }> {
    const state = store.getState(); // importante
    const token = state.auth.access;

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
