import { ref } from "vue";
import Cookies from "js-cookie";
import { Constant } from "@/types";
import { pathRewrite } from "./request";

const host = window.location.host
const baseUrl = `http${import.meta.env.MODE === 'development' ? '' : 's'}://${host}${pathRewrite}`

const useDownload = () => {
  const process = ref(0);
  const isDownloading = ref(false);

  const getFileExtension = (url: string) => {
    const pathname = new URL(url).pathname;
    const lastDotIndex = pathname.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return "";
    }
    return pathname.slice(lastDotIndex + 1);
  };

  const getFileName = (url: string) => {
    const pathname = new URL(url).pathname;
    const lastDotIndex = pathname.lastIndexOf("/");
    if (lastDotIndex === -1) {
      return "未知文件";
    }
    return pathname.slice(lastDotIndex + 1);
  };

  const downloadFile = (url: string, filename?: string, extension?: string) => {
    url = baseUrl + url
    isDownloading.value = true;
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    if (Cookies.get(Constant.JWT_HEADER_NAME)) {
      xhr.setRequestHeader(
        Constant.JWT_HEADER_NAME,
        Cookies.get(Constant.JWT_HEADER_NAME) as string
      );
    }
    xhr.responseType = "blob";
    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.floor((event.loaded / event.total) * 100);
        console.log(percentComplete);

        process.value = percentComplete;
      }
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = new Blob([xhr.response], {
          type: "application/octet-stream",
        });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        const ext = extension || '';
        
        if (filename) {
          a.download = `${filename}${ext ? "." : ""}${ext}`;
        } else {
          const urlFileNmae = getFileName(url);
          a.download = urlFileNmae;
        }
        a.click();
        // 调用 URL.revokeObjectURL() 方法来释放该内存
        URL.revokeObjectURL(a.href);
      } else {
      }
      // 清空进度
      process.value = 0;
      isDownloading.value = false;
    };
    xhr.send();
  };

  return {
    downloadFile,
    process,
    isDownloading,
  };
};

export default useDownload;
