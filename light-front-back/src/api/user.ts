import { http } from "@/utils/http";
<<<<<<< HEAD
=======
import { Page, R, User } from "./type";
>>>>>>> 646f847774b2fcfc24adedfa4c319b003985df9e

export type UserResult = {
  success: boolean;
  data: {
    /** 头像 */
    avatar: string;
    /** 用户名 */
    username: string;
    /** 昵称 */
    nickname: string;
    /** 当前登录用户的角色 */
    roles: Array<string>;
    /** 按钮级别权限 */
    permissions: Array<string>;
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

export type RefreshTokenResult = {
  success: boolean;
  data: {
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<UserResult>("post", "/auth/login", { data });
};

export const getProfile = () => {
  return http.request<any>("get", "/user/profile", {});
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>("post", "/refresh-token", { data });
};
<<<<<<< HEAD
=======

export const getUserPageApi = (params?: object) => {
  return http.request<R<Page<User[]>>>("get", "/user/admin/page", { params });
};

export const updateUserApi = (id: number, data?: Partial<User>) => {
  return http.request<R<Page<User[]>>>("post", "/user/admin/update/" + id, {
    data
  });
};

export const deleteUserApi = (id: number[]) => {
  return http.request<R<Page<User[]>>>(
    "post",
    "/user/admin/delete/" + id.join(","),
    {}
  );
};

export const getUserRecordPageApi = (params?: object) => {
  return http.request<R<Page<User[]>>>("get", "/user/admin/record/page", {
    params
  });
};
>>>>>>> 646f847774b2fcfc24adedfa4c319b003985df9e
