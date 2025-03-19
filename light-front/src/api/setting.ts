import type { AllowList, R, RC } from "@/types";
import client, { pathRewrite } from "@/utils/request";
import type { AxiosResponse } from "axios";

export function getAiAllowListApi(): Promise<AxiosResponse<R<AllowList[]>>> {
  return client.get("/setting/aiAllowList", {
    headers: {
      isToken: false,
    },
  });
}

export function getLanguageApi(): Promise<AxiosResponse<R<RC[]>>> {
  return client.get("/setting/language", {
    headers: {
      isToken: false,
    },
  });
}
