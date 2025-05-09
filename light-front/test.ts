export enum ModelType {
  DEEP_SEEK = "deepseek",
  QIAN_WEN = "qianwen",
  QIAN_FAN = "qianfan",
  DOU_BAO = "doubao",
}

Object.keys(ModelType).forEach(value => {
  console.log(value);

})