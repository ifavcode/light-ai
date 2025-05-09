import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark-dimmed.min.css";
import markedKatex from "marked-katex-extension";
import mitt from "mitt";
import { ModelInputType } from "@/types";
import { nanoid } from "nanoid";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ObjectValues<T> = T[keyof T];

export function getAssetsImg(pos: string) {
  return new URL(`/src/assets` + pos, import.meta.url).href;
}

export function getPublicImg(pos: string) {
  return new URL(`/model` + pos, import.meta.url).href;
}

// AI模型LOGO URL
export const modelImageMap = {
  // deepseek: getAssetsImg('/model/deepseek.png'),
  // qianfan: getAssetsImg('/model/qianfan.png'),
  // qianwen: getAssetsImg('/model/qianwen.png'),
  // doubao: getAssetsImg('/model/doubao.png'),
  // kimi: getAssetsImg('/model/kimi.png'),
  deepseek: "https://www.guetzjb.cn/assets_other/2025-02-26/deepseek.png",
  claude: "https://www.guetzjb.cn/assets_other/2025-02-26/claude-color.png",
  qianfan: "https://www.guetzjb.cn/assets_other/2025-02-26/qianfan.png",
  qianwen: "https://www.guetzjb.cn/assets_other/2025-02-26/qianwen.png",
  doubao: "https://www.guetzjb.cn/assets_other/2025-02-26/doubao.png",
  kimi: "https://www.guetzjb.cn/assets_other/2025-02-26/kimi.png",
  gemini: "https://www.guetzjb.cn/assets_other/2025-02-26/gemini-color.png",
  zhipu: "https://www.guetzjb.cn/assets_other/2025-02-26/zhipu-color.png",
  hunyuan: "https://www.guetzjb.cn/assets_other/2025-02-26/hunyuan-color.png",
  yuewen: "https://www.guetzjb.cn/assets_other/2025-02-26/yuewen.png",
  baichuan: "https://www.guetzjb.cn/assets_other/2025-02-26/baichuan-color.png",
  xunfei: "https://www.guetzjb.cn/assets_other/2025-02-26/xunfei.png",
  chatgpt: "https://www.guetzjb.cn/assets_other/2025-02-26/openai.png",
};

export const modelImages = [
  getPublicImg("/deepseek.png"),
  getPublicImg("/claude-color.png"),
  getPublicImg("/qianfan.png"),
  getPublicImg("/qianwen.png"),
  getPublicImg("/doubao.png"),
  getPublicImg("/kimi.png"),
  getPublicImg("/gemini-color.png"),
  getPublicImg("/zhipu-color.png"),
  getPublicImg("/hunyuan-color.png"),
  getPublicImg("/yuewen.png"),
  getPublicImg("/baichuan-color.png"),
  getPublicImg("/xunfei.png"),
  getPublicImg("/openai.png"),
];

export const marked = new Marked(
  markedHighlight({
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      const htmlCode = hljs.highlight(code, { language }).value;
      return `<div lang=${lang}>${htmlCode}</div>`;
    },
  })
);
marked.use(
  markedKatex({
    throwOnError: true,
    nonStandard: true,
  })
);
marked.use({
  breaks: true,
});

const emitter = mitt<{
  loginSuccess: void;
}>();

const enhanceCodeBlock = (content: string) => {
  return content.replace(
    /<pre><code/g,
    `
    <pre><div class="enhance" >
        <div class="lang">CODE</div>
        <div class="copyCode">
          <i class='iconfont'>&#xe725;</i>
        </div>
    </div><code
  `
  );
};

// 提取文件扩展名并转为小写（兼容带路径的文件名）
function classifyFile(filename: string): ModelInputType {
  const parts = filename.split(/[\\/]/).pop();
  if (!parts) return ModelInputType.OTHER;
  const ext = parts.split(".").pop()?.toLowerCase() || ModelInputType.OTHER;

  // 分类规则
  const imageExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "bmp",
    "svg",
    "ico",
    "tiff",
  ];
  const videoExtensions = [
    "mp4",
    "mov",
    "avi",
    "mkv",
    "flv",
    "wmv",
    "webm",
    "mpeg",
    "3gp",
  ];
  const textExtensions = [
    "txt",
    "md",
    "rtf",
    "text",
    "log",
    "ini",
    "conf",
    "js",
    "jsx",
    "ts",
    "tsx",
    "html",
    "htm",
    "css",
    "scss",
    "json",
    "xml",
    "py",
    "java",
    "kt",
    "cpp",
    "c",
    "h",
    "php",
    "rb",
    "go",
    "rs",
    "swift",
    "sql",
    "sh",
    "bat",
    "cmd",
    "yml",
    "yaml",
    "toml",
    "env",
    "gitignore",
  ];

  if (imageExtensions.includes(ext)) return ModelInputType.IMAGE;
  if (videoExtensions.includes(ext)) return ModelInputType.VIDEO;
  if (textExtensions.includes(ext)) return ModelInputType.TEXT;
  return ModelInputType.OTHER;
}

async function getUrlToBase64(url: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  return new Promise((resolve) => {
    reader.onloadend = () => resolve(reader.result);
  });
}

function randomFileName(file: File) {
  const name = file.name;
  const ids = name.lastIndexOf(".");
  const prefix = nanoid(8);
  if (ids != -1) {
    return prefix + name.substring(ids);
  }
  return prefix;
}

export {
  emitter,
  enhanceCodeBlock,
  classifyFile,
  getUrlToBase64,
  randomFileName,
};
