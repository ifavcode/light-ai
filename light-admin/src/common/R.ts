
export default class R {
  msg: string = '';
  code: number = 200;
  data: any = null;

  constructor(code: number, msg?: string, data?: any) {
    this.code = code;
    if (msg) {
      this.msg = msg;
    }
    this.data = data;
  } 

  static ok(msg?: string, data?: any) {
    return new R(200, msg, data);
  }

  static okD(data?: any) {
    return new R(200, 'success', data);
  }

  static error(msg?: string, data?: any) {
    return new R(500, msg, data);
  }

  static errorD(data?: any) {
    return new R(500, 'error', data);
  }
}
