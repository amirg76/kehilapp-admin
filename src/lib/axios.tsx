// axios
import Axios from "axios";

export const api = Axios.create({
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = window.localStorage.getItem("token");
    config.headers = config.headers || {};
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);
