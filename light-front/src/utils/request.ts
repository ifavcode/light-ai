import Axios, { type InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import router from "@/router/index";
import { Constant } from "@/types";

declare global {
  interface Window {}
}

const host = window.location.host;
export const pathRewrite = "/dev-api";
const noTipsPath = ["/user/profile", "/auth/login"];

const client = Axios.create({
  baseURL: `http${
    import.meta.env.MODE === "development" ? "" : "s"
  }://${host}${pathRewrite}`,
  timeout: 1000 * 10,
});

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig<any>) => {
    const isToken = (config.headers || {}).isToken;
    if (Cookies.get(Constant.JWT_HEADER_NAME) && isToken) {
      config.headers[Constant.JWT_HEADER_NAME] = Cookies.get(
        Constant.JWT_HEADER_NAME
      );
    }
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

let timer: number;
client.interceptors.response.use(
  function (response) {
    // 2xx 范围内的状态码都会触发该函数。
    // 对响应数据做点什么
    const code = response.data.code;
    if (code === 403) {
      router.push("/forbidden");
    }
    return response;
  },
  (error) => {
    // 超出 2xx 范围的状态码都会触发该函数。
    // 对响应错误做点什么
    const status = error.response.status;
    if (status === 401) {
      if (noTipsPath.includes(error.config.url)) return;
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        window.$message.warning("请登录");
      }, 100);
      // router.push('/login')
    } else if (status === 500) {
      // window.$message.error('接口异常')
    } else if (status === 403) {
      // router.push('/forbidden')
    }
    return Promise.reject(error);
  }
);

export default client;
