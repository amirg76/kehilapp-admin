// axios
import { LOGIN_URL } from "@/api/apiConstants";
import Axios, { AxiosInstance } from "axios";

export const api: AxiosInstance = Axios.create({
  withCredentials: true,
});

// api.interceptors.request.use(
//   (config) => {
//     const loggedInUser = sessionStorage.getItem("loggedInUser");
//     const userData = JSON.parse(loggedInUser);
//     const token = userData.data.token;

//     if (token && config.url !== LOGIN_URL) {
//       config.headers = config.headers || {};
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);
