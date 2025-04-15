import axios from "axios";
import Cookies from "js-cookie"

const api = axios.create({
  baseURL: process.env.REACT_APP_DOMAIN
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `${process.env.REACT_APP_PREFIX} ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

export default api