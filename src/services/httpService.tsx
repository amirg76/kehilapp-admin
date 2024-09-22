import { QueryClient } from "react-query";
import { api } from "@/lib/axios";
export const queryClient = new QueryClient();

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
  try {
    const res = await api({
      url: endpoint,
      method,
      data,
      params: method === "GET" ? data : null,
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
