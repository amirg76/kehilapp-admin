import { api } from "@/lib/axios";
import { LOGIN_URL } from "@/api/apiConstants";
// var axios = Axios.create({
//   withCredentials: true,
// });

export const httpService = {
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

async function ajax(endpoint, method = "GET", data = null) {
  const headers = {
    Authorization: "",
  };
  const loggedInUser = localStorage.getItem("loggedInUser");

  if (endpoint !== LOGIN_URL && method === "POST") {
    headers.Authorization = `Bearer ${loggedInUser}`;
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
    return {
      isError: true,
      status: err.error.status,
      message: err.error.message,
    };
  }
}
