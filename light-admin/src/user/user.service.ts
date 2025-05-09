import { HttpException, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Like, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { bcryptPassword } from 'src/utils';
import { da, fa, faker } from '@faker-js/faker';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import {
  Constant,
  RedisConstant,
  SSHConstant,
  VirCompanyConstant,
} from 'src/config/constant';
import { Client } from 'ssh2';
import tmp from 'tmp';
import { Response } from 'express';
import archiver from 'archiver';
import { UserRecord } from './entities/user-record.entity';
import { QueryUserDto } from './dto/query-user.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<User>,
    @Inject('USER_RECORD_REPOSITORY')
    private readonly userRecordRepository: Repository<UserRecord>,
    @InjectRedis() private readonly redis: Redis,
    @Inject('SSH_CLIENT_SOURCE')
    private readonly sshClientSpec: Client,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.findOneUsername(createUserDto.username);
    if (user) {
      throw new HttpException('账户已被注册', 500);
    }
    const hash = await bcryptPassword(createUserDto.password);
    createUserDto.password = hash;
    return this.userRepository.save(createUserDto);
  }

  async autoCreate() {
    const createUserDto = new CreateUserDto();
    createUserDto.avatar = faker.image.avatar();
    createUserDto.username = faker.internet.username();
    createUserDto.nickname = faker.internet.displayName();
    const pwd = faker.internet.password();
    createUserDto.password = await bcryptPassword(pwd);
    createUserDto.createTime = new Date();
    const user = await this.userRepository.save(createUserDto);
    // 三天内首次改密不用输入旧密码
    this.redis.setex(
      RedisConstant.USER_NOT_OLD_PWD + user.id,
      60 * 60 * 24 * 3,
      1,
    );
    return {
      raw: pwd,
      user: createUserDto,
    };
  }

  async findAll(queryUserDto: QueryUserDto) {
    const whereCondition: any = {};
    if (queryUserDto.nickname) {
      whereCondition.nickname = Like(queryUserDto.nickname);
    }
    if (queryUserDto.username) {
      whereCondition.username = Like(queryUserDto.username);
    }
    queryUserDto.total = await this.userRepository.count({
      where: whereCondition,
    });
    const list = await this.userRepository.find({
      where: whereCondition,
      take: queryUserDto.pageSize,
      skip: queryUserDto.getSkip(),
      relations: {
        roles: true,
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        createTime: true,
        password: false,
      },
    });
    queryUserDto.setList(list);
    return queryUserDto;
  }

  async findRecordAll(queryUserDto: QueryUserDto) {
    const whereCondition: any = {};
    if (queryUserDto.nickname) {
      whereCondition.nickname = Like(queryUserDto.nickname);
    }
    if (queryUserDto.username) {
      whereCondition.username = Like(queryUserDto.username);
    }
    queryUserDto.total = await this.userRecordRepository.count({
      where: whereCondition,
    });
    const list = await this.userRecordRepository.find({
      where: whereCondition,
      take: queryUserDto.pageSize,
      skip: queryUserDto.getSkip(),
      order: {
        createTime: 'DESC',
      },
      relations: {
        user: true,
      },
      select: {
        user: {
          nickname: true,
          avatar: true,
        },
      },
    });
    queryUserDto.setList(list);
    return queryUserDto;
  }

  findOne(id: number) {
    return this.userRepository.findOne({
      where: {
        id,
      },
    });
  }

  findOneUsername(username: string) {
    return this.userRepository.findOne({
      where: {
        username,
      },
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  delete(id: number[]) {
    return this.userRepository.delete(id);
  }

  async listFiles(user: User, dir: string) {
    try {
      const fileList: any = await this.list(user, dir);
      const m = { dir: 0, file: 1 };
      fileList.sort((o1, o2) => {
        if (o1.type == o2.type) {
          return o1.filename <= o2.filename;
        } else {
          return m[o1.type] - m[o2.type];
        }
      });
      return fileList;
    } catch (error) {
      if (dir === '') {
        return [];
      } else {
        throw new HttpException(error.message, 500);
      }
    }
  }

  private async list(user: User, dir: string) {
    return new Promise((resolve, reject) => {
      this.sshClientSpec.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }
        sftp.readdir(
          SSHConstant.METAGPT_BASE_PATH +
            user.id +
            '/' +
            dir.split(',').join('/'),
          (err, entries) => {
            sftp.end();
            if (err) {
              reject(err);
              return;
            }
            const back = entries.map((entry) => {
              entry['type'] =
                (entry.attrs.mode & 0o170000) === 0o040000 ? 'dir' : 'file';
              return entry;
            });
            resolve(back);
          },
        );
      });
    });
  }

  async createDirFunc(user: User, dir: string) {
    try {
      await this.createDir(user, dir);
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  private async createDir(user: User, dir: string) {
    return new Promise((resolve, reject) => {
      this.sshClientSpec.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }
        dir =
          SSHConstant.METAGPT_BASE_PATH +
          user.id +
          '/' +
          dir.split(',').join('/');

        const createDirectory = (
          path: string,
          callback: (err?: Error) => void,
        ) => {
          sftp.exists(path, (exists) => {
            if (exists) {
              callback();
            } else {
              const parentDir = path.substring(0, path.lastIndexOf('/'));
              createDirectory(parentDir, (err) => {
                if (err) {
                  callback(err);
                } else {
                  sftp.mkdir(path, (err) => {
                    if (err) {
                      callback(err);
                    } else {
                      callback();
                    }
                  });
                }
              });
            }
          });
        };

        createDirectory(dir, (err) => {
          if (err) {
            reject(err.message);
          } else {
            resolve('创建成功');
          }
        });
      });
    });
  }

  async getFileContentFunc(user: User, dir: string) {
    try {
      return this.getFileContent(user, dir);
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async getFileContent(user: User, dir: string) {
    const basePath = SSHConstant.METAGPT_BASE_PATH + user.id;
    dir = basePath + '/' + dir.split(',').join('/');

    return new Promise((resolve, reject) => {
      this.sshClientSpec.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }

        sftp.readFile(dir, 'utf-8', (err, data) => {
          sftp.end();
          if (err) {
            reject(err);
            return;
          }
          resolve(data);
        });
      });
    });
  }

  // async getMediaFileContent(user: User, dir: string) {
  //   const basePath = SSHConstant.METAGPT_BASE_PATH + user.id;
  //   dir = basePath + '/' + dir.split(',').join('/');

  //   return new Promise((resolve, reject) => {
  //     this.sshClientSpec.sftp((err, sftp) => {
  //       if (err) {
  //         reject(err);
  //         return;
  //       }
  //       const tmpFile = tmp.fileSync();
  //       sftp.fastGet(dir, tmpFile.name, (err) => {
  //         sftp.end();
  //         if (err) {
  //           reject(err);
  //           return;
  //         }
  //       });

  //     });
  //   });
  // }

  async uploadFileFromBufferToMetaGPT(
    file: Express.Multer.File,
    user: User,
    dir: string,
  ): Promise<string> {
    try {
      await this.createDir(user, dir.split(',').join('/'));
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
    let remotePath =
      VirCompanyConstant.WORKERSPACE_DIR +
      user.id +
      '/' +
      dir.split(',').join('/');
    return new Promise((resolve, reject) => {
      this.sshClientSpec.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }
        remotePath += '/' + file.originalname;
        const writeStream = sftp.createWriteStream(remotePath);
        writeStream.on('error', (streamErr: Error) => {
          sftp.end();
          reject(streamErr);
        });
        writeStream.write(file.buffer, () => {
          writeStream.end(() => {
            sftp.end();
            resolve('success');
          });
        });
      });
    });
  }

  async deleteFileFunc(user: User, dir: string) {
    try {
      return this.deleteFile(user, dir);
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async deleteFile(user: User, dir: string) {
    let remotePath =
      VirCompanyConstant.WORKERSPACE_DIR +
      user.id +
      '/' +
      dir.split(',').join('/');
    return new Promise((resolve, reject) => {
      this.sshClientSpec.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }
        sftp.exists(remotePath, (f) => {
          if (!f) {
            resolve('');
          }
          sftp.unlink(remotePath, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve('');
            }
          });
        });
      });
    });
  }

  async deleteDirFunc(user: User, dir: string) {
    try {
      return await this.deleteDir(user, dir);
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async deleteDir(user: User, dir: string) {
    let remotePath =
      VirCompanyConstant.WORKERSPACE_DIR +
      user.id +
      '/' +
      dir.split(',').join('/');

    return new Promise((resolve, reject) => {
      this.sshClientSpec.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }
        const deleteRecursive = (
          path: string,
          callback: (err?: Error) => void,
        ) => {
          sftp.stat(path, (err, stats) => {
            if (err) {
              callback(err);
              return;
            }

            if (stats.isDirectory()) {
              sftp.readdir(path, (err, list) => {
                if (err) {
                  callback(err);
                  return;
                }
                if (list.length === 0) {
                  sftp.rmdir(path, callback);
                  return;
                }
                let completed = 0;
                list.forEach((item) => {
                  const itemPath = `${path}/${item.filename}`;
                  deleteRecursive(itemPath, (err) => {
                    if (err) {
                      callback(err);
                      return;
                    }
                    completed++;
                    if (completed === list.length) {
                      sftp.rmdir(path, callback);
                    }
                  });
                });
              });
            } else {
              // 如果是文件，直接删除
              sftp.unlink(path, callback);
            }
          });
        };

        sftp.exists(remotePath, (exists) => {
          if (!exists) {
            resolve('');
            return;
          }

          deleteRecursive(remotePath, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve('');
            }
          });
        });
      });
    });
  }
  // TODO下载文件 | 文件夹
  async downloadFileFunc(user: User, dir: string, res: Response) {
    try {
      await this.downloadFile(user, dir, res);
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async downloadFile(user: User, dir: string, res: Response) {
    const dirArr = dir.split(',');
    let remotePath =
      VirCompanyConstant.WORKERSPACE_DIR + user.id + '/' + dirArr.join('/');
    const filename = dirArr[dirArr.length - 1];
    return new Promise((resolve, reject) => {
      this.sshClientSpec.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }
        sftp.exists(remotePath, (exists) => {
          if (!exists) {
            reject('没有找到文件');
            return;
          }
          sftp.stat(remotePath, (statErr, stats) => {
            if (statErr) {
              reject(statErr);
              sftp.end();
              return;
            }
            res.setHeader(
              'Content-Disposition',
              `attachment; filename="${filename}"`,
            );
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Length', stats.size);
            const readStream = sftp.createReadStream(remotePath);
            readStream.pipe(res, {
              end: true,
            });
            readStream.on('end', () => {
              sftp.end();
              resolve('');
            });
            readStream.on('error', (err) => {
              reject(err);
            });
          });
        });
      });
    });
  }

  async downloadDirFunc(user: User, dir: string, res: Response) {
    try {
      this.downloadDir(user, dir, res);
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async downloadDir(user: User, dir: string, res: Response) {
    const dirArr = dir.split(',');
    let remotePath =
      VirCompanyConstant.WORKERSPACE_DIR + user.id + '/' + dirArr.join('/');
    const filename = dirArr[dirArr.length - 1];
    const archive = archiver('zip', { zlib: { level: 9 } });
    return new Promise((resolve, reject) => {
      this.sshClientSpec.sftp(async (err, sftp) => {
        if (err) {
          reject(err);
          return;
        }
        sftp.stat(remotePath, async (statErr, stats) => {
          if (statErr) {
            reject(statErr);
            sftp.end();
            return;
          }
          // res.setHeader('Content-Length', stats.size);
          res.attachment(`${filename}.zip`);
          archive.pipe(res);
          await this.addFolderToArchive(sftp, remotePath, archive, '');
          await archive.finalize();
          resolve('');
        });
      });
    });
  }

  private async addFolderToArchive(
    sftp: any,
    remotePath: string,
    archive: archiver.Archiver,
    localPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      sftp.readdir(remotePath, (err, entries) => {
        let fileSize = 0;
        if (err) {
          reject(err);
          return;
        }

        let pending = entries.length;
        if (pending === 0) {
          resolve(); // 如果文件夹为空，直接完成
        }

        entries.forEach((entry) => {
          const remoteFilePath = `${remotePath}/${entry.filename}`;
          const localFilePath = localPath
            ? `${localPath}/${entry.filename}`
            : entry.filename;

          // 如果是文件夹，递归处理
          if (entry.longname.startsWith('d')) {
            this.addFolderToArchive(
              sftp,
              remoteFilePath,
              archive,
              localFilePath,
            )
              .then(() => {
                pending--;
                if (pending === 0) {
                  resolve();
                }
              })
              .catch(reject);
            return;
          }

          const readStream = sftp.createReadStream(remoteFilePath);
          archive.append(readStream, { name: localFilePath });

          readStream.on('end', () => {
            pending--;
            if (pending === 0) {
              resolve();
            }
          });

          readStream.on('error', (err) => {
            reject(err);
          });
        });
      });
    });
  }

  async saveRecord(rowIp: string, ip: string, agent: string, user?: User) {
    const ur = new UserRecord();
    ur.rowIp = rowIp;
    ur.ip = ip;
    ur.createTime = new Date();
    ur.agent = agent;
    if (user) {
      ur.user = user;
    }
    return this.userRecordRepository.save(ur);
  }
}
