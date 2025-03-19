import type { ExecCode, R } from "@/types";
import client from "@/utils/request";
import type { AxiosResponse } from "axios";

export function execCodeApi(data: ExecCode): Promise<AxiosResponse<R<void>>> {
  return client.post("/qianwenDialogGroup", data, {
    headers: {
      isToken: true,
    },
  });
}
