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
  page: Page
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
