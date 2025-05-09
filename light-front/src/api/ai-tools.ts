import type {
  AiTool,
  Page,
  PicToVideo,
  PicToVideoDTO,
  R,
  VirtualCompany,
  VirtualCompanyDTO,
} from "@/types";
import client from "@/utils/request";
import useDownload from "@/utils/useDownload";
import type { AxiosResponse } from "axios";

export function getAiToolsApi(): Promise<AxiosResponse<R<AiTool[]>>> {
  return client.get("/tools", {
    headers: {
      isToken: false,
    },
  });
}

export function getAiToolApi(
  id: number | string
): Promise<AxiosResponse<R<AiTool>>> {
  return client.get("/tools/id/" + id, {
    headers: {
      isToken: false,
    },
  });
}

export function createPicToVideoApi(
  data: PicToVideoDTO
): Promise<AxiosResponse<R<string>>> {
  return client.post("/tools/picToVideo", data, {
    headers: {
      isToken: true,
    },
  });
}

export function getPicToVideoAllowApi(): Promise<AxiosResponse<R<boolean>>> {
  return client.get("/tools/picToVideoAllow", {
    headers: {
      isToken: true,
    },
  });
}

export function getPicToVideoListApi(
  page: Page<any>
): Promise<AxiosResponse<R<PicToVideo[]>>> {
  return client.get("/tools/picToVideo", {
    headers: {
      isToken: true,
    },
    params: page,
  });
}

export function getPicToVideoDetailsApi(
  id: number
): Promise<AxiosResponse<R<PicToVideo>>> {
  return client.get("/tools/picToVideo/" + id, {
    headers: {
      isToken: true,
    },
  });
}

export function createVirtualCompoanyApi(
  data: VirtualCompanyDTO
): Promise<AxiosResponse<R<boolean>>> {
  return client.post("/tools/virtualCompoany", data, {
    headers: {
      isToken: true,
    },
  });
}

export function getVirtualCompoanyAllowApi(
): Promise<AxiosResponse<R<boolean>>> {
  return client.get("/tools/virtualCompoanyAllow", {
    headers: {
      isToken: true,
    },
  });
}

export function getVirtualCompoanyLastApi(
): Promise<AxiosResponse<R<VirtualCompany>>> {
  return client.get("/tools/virtualCompoanyLast", {
    headers: {
      isToken: true,
    },
  });
}

export function getVirtualCompoanyListApi(
): Promise<AxiosResponse<R<VirtualCompany[]>>> {
  return client.get("/tools/virtualCompoanyList", {
    headers: {
      isToken: true,
    },
  });
}

export function getVirtualCompoanyDetailsApi(
  id: number
): Promise<AxiosResponse<R<VirtualCompany>>> {
  return client.get("/tools/virtualCompoanyList/" + id, {
    headers: {
      isToken: true,
    },
  });
}

export async function changeNameBatchApi(file: File, otherParams?: any) {
  const response = await client.post(
    "/tools/changeNameBatch",
    {
      file,
      ...otherParams
    },
    {
      headers: {
        isToken: true,
        "Content-Type": "multipart/form-data",
      },
      responseType: "blob",
    }
  );
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  const contentDisposition = response.headers["content-disposition"];
  let filename = "download.zip";
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(
      /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
    );
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, "");
    }
  }
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
