import type {
  CreateQianwenMapDto,
  DialogGroup,
  Page,
  R,
  TextToVideoDTO,
} from "@/types";
import client from "@/utils/request";
import type { AxiosResponse } from "axios";
import { type CreateQianwenDto } from "../types/index";

export function createDialogGroupApi(
  data: Partial<DialogGroup>
): Promise<AxiosResponse<R<DialogGroup>>> {
  return client.post("/qianwenDialogGroup", data, {
    headers: {
      isToken: true,
    },
  });
}

export function sendMsgApi(data: Partial<CreateQianwenDto>) {
  return client.post("/qianwen/dialog", data, {
    headers: {
      isToken: true,
    },
  });
}

export function sendMsgMoreApi(data: CreateQianwenMapDto) {
  return client.post("/qianwen/dialogMore", data, {
    headers: {
      isToken: true,
    },
  });
}

export function getQianwenDialogGroupApi(
  params?: Page<any>
): Promise<AxiosResponse<R<DialogGroup[]>>> {
  return client.get(`/qianwenDialogGroup/normal`, {
    headers: {
      isToken: true,
    },
    params,
  });
}

export function getQianwenDialogGroupMoreApi(
  params?: Page<any>
): Promise<AxiosResponse<R<DialogGroup[]>>> {
  return client.get(`/qianwenDialogGroup/more`, {
    headers: {
      isToken: true,
    },
    params,
  });
}

export function getQianwenDialogGroupOneApi(
  id: number
): Promise<AxiosResponse<R<DialogGroup>>> {
  return client.get(`/qianwenDialogGroup/id/${id}`, {
    headers: {
      isToken: true,
    },
  });
}

export function cancelRequestApi(): Promise<AxiosResponse<void>> {
  return client.get(`/qianwen/cancel`, {
    headers: {
      isToken: true,
    },
  });
}

export function speakTextApi(data: TextToVideoDTO) {
  return client.post("/qianwen/textToVideo", data, {
    headers: {
      isToken: true,
    },
  });
}

export function getAudioHistoryApi(
  id: number
): Promise<AxiosResponse<R<null | string>>> {
  return client.get("/qianwen/getAudioHistory?id=" + id, {
    headers: {
      isToken: true,
    },
  });
}
