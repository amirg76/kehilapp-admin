import { api } from "@/lib/axios";
import { LOGIN_URL } from "@/api/apiConstants";
import { handleHttpServiceErrors } from "./handleHttpServiceErrors";
// var axios = Axios.create({
//   withCredentials: true,
// });
interface HttpService {
  get(endpoint: string, data: any): Promise<any>;
  post(endpoint: string, data: any): Promise<any>;
  put(endpoint: string, data: any): Promise<any>;
  delete(endpoint: string, data: any): Promise<any>;
  [key: string]: (endpoint: string, data: any) => Promise<any>;
}
export const httpService: HttpService = {
  get(endpoint, data) {
    return ajax(endpoint, "GET", data);
  },
  post(endpoint, data) {
    return ajax(endpoint, "POST", data);
  },
  put(endpoint, data) {
    return ajax(endpoint, "PUT", data);
  },
  delete(endpoint, data) {
    return ajax(endpoint, "DELETE", data);
  },
};

async function ajax(endpoint: string, method = "GET", data = null) {
  const headers = {
    Authorization: "",
  };
  const loggedInUser = sessionStorage.getItem("loggedInUser");

  if (endpoint !== LOGIN_URL && method === "POST") {
    if (loggedInUser) {
      const userData = JSON.parse(loggedInUser);

      headers.Authorization = `Bearer ${userData.data.token}`;
    }

    // headers.Authorization = `Bearer ${loggedInUser}`;
  }

  try {
    const res = await api({
      url: endpoint,
      method,
      data,
      params: method === "GET" ? data : null,
      headers,
    });

    return res.data;
  } catch (err) {
    return handleHttpServiceErrors(err);
  }
}
