export enum Constant {
  JWT_SECRET = 'ZHANGJINBO',
  JWT_EXPIRE_TIME = '7d', // 7天
  JWT_PREFIX = 'Bearer ',
  JWT_HEADER_NAME = 'Authorization',
}

export enum RedisConstant {
  USER_KEY = 'USER_ID:',
  AUTH_KEY = 'USER_AUTH:',
  USER_NOT_OLD_PWD = 'USER_NOT_OLD_PWD:',
}

export enum PasswordConstant {
  SALT_ROUNDS = 10,
}

export enum CoderRunnerConstant {
  JAVA_RUNNER_IMAGE_NAME = 'java-exec',
  JAVA_CONTAINER_NAME = 'java-container-exec',
  PYTHON_RUNNER_IMAGE_NAME = 'python-exec',
  PYTHON_CONTAINER_NAME = 'python-container-exec',
  GCC_RUNNER_IMAGE_NAME = 'gcc-exec',
  GCC_CONTAINER_NAME = 'gcc-container-exec',
}

export enum VirCompanyConstant {
  IMAGE_NAME = 'metagpt/metagpt:latest',
  WORKERSPACE_DIR = '/opt/metagpt/workspace/',
}

export enum SystemConstant {
  DOMAIN = 'https://www.guetzjb.cn', // 存储文件服务器的域名
  FILE_ADDRESS = '/opt/files',
  NGINX_ASSETS = '/assets_other',
}

export enum SSHConstant {
  METAGPT_BASE_PATH = '/opt/metagpt/workspace/',
}

export enum RoleConstant {
  User = 'user',
  Admin = 'admin',
}
