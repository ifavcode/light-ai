import type { Auth, Page, R, User } from "@/types";
import client from "@/utils/request";
import useDownload from "@/utils/useDownload";
import type { AxiosResponse } from "axios";

export async function loginApi(data: Auth): Promise<AxiosResponse<R<string>>> {
  return await client.post("/auth/login", data, {
    headers: {
      isToken: false,
    },
  });
}

export async function getUserProfileApi(): Promise<AxiosResponse<R<User>>> {
  return await client.get("/user/profile", {
    headers: {
      isToken: true,
    },
  });
}

export async function autoRegisterApi(): Promise<
  AxiosResponse<R<Record<string, any>>>
> {
  return await client.post(
    "/user/autoRegister",
    {},
    {
      headers: {
        isToken: false,
      },
    }
  );
}

export async function logoutApi(): Promise<AxiosResponse<R<void>>> {
  return await client.post(
    "/auth/logout",
    {},
    {
      headers: {
        isToken: true,
      },
    }
  );
}

export async function judgeChangePwdApi(): Promise<AxiosResponse<R<boolean>>> {
  return await client.get("/auth/judgeChangePwd", {
    headers: {
      isToken: true,
    },
  });
}

export async function changePwdApi(
  data: any
): Promise<AxiosResponse<R<boolean>>> {
  return await client.post("/auth/changePwd", data, {
    headers: {
      isToken: true,
    },
  });
}

export async function getUserFilesApi(
  dir: string = ""
): Promise<AxiosResponse<R<Record<string, any>[]>>> {
  return await client.get("/user/files?dir=" + dir, {
    headers: {
      isToken: true,
    },
  });
}

export async function createDirApi(
  dir: string = ""
): Promise<AxiosResponse<R<boolean>>> {
  return await client.post(
    "/user/createDir?dir=" + dir,
    {},
    {
      headers: {
        isToken: true,
      },
    }
  );
}

export async function getFileContentApi(
  dir: string = ""
): Promise<AxiosResponse<R<string>>> {
  return await client.get("/user/fileContent?dir=" + dir, {
    headers: {
      isToken: true,
    },
  });
}

export async function deleteFileApi(
  dir: string = ""
): Promise<AxiosResponse<R<string>>> {
  return await client.post(
    "/user/deleteFile?dir=" + dir,
    {},
    {
      headers: {
        isToken: true,
      },
    }
  );
}

export async function deleteDirApi(
  dir: string = ""
): Promise<AxiosResponse<R<string>>> {
  return await client.post(
    "/user/deleteDir?dir=" + dir,
    {},
    {
      headers: {
        isToken: true,
      },
    }
  );
}

export function downloadFileApi(dir: string[], filename: string) {
  const download = useDownload();
  const idx = filename.lastIndexOf(".");
  download.downloadFile(
    "/user/downloadFile?dir=" + [...dir, filename].join(","),
    filename.substring(0, idx),
    idx !== -1 ? filename.substring(idx + 1) : ""
  );
  return download;
}

export function downloadDirApi(dir: string[], filename: string) {
  const download = useDownload();
  download.downloadFile(
    "/user/downloadDir?dir=" + [...dir, filename].join(","),
    filename,
    "zip"
  );
  return download;
}

export async function userRecordApi(): Promise<
  AxiosResponse<R<Record<string, any>>>
> {
  return await client.get("/user/record", {
    headers: {
      isToken: true,
    },
  });
}

export async function getUserPageApi(): Promise<AxiosResponse<R<Page<User>>>> {
  return await client.get("/user/admin/page", {
    headers: {
      isToken: true,
    },
  });
}

export async function uploadFileApi(
  file: File
): Promise<AxiosResponse<R<string>>> {
  const formData = new FormData();
  formData.append("file", file);
  return await client.post("/upload/oss", formData, {
    headers: {
      isToken: true,
    },
  });
}
