import { forwardRef, Inject, Injectable } from '@nestjs/common';
import Docker, { Container } from 'dockerode';
import { ExecCode } from './entities/exec-code.entity';
import tmp from 'tmp';
import fs from 'fs';
import { CodeType, ExecStatus, TaskStatusEnum } from 'src/types';
import path from 'path';
import {
  CoderRunnerConstant,
  Constant,
  VirCompanyConstant,
} from 'src/config/constant';
import { Socket } from 'socket.io';
import { PassThrough } from 'node:stream';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/entities/user.entity';
import { VirtualCompanyDTO } from 'src/ai/tools/dto/virtual-company.dto';
import { VirtualCompany } from 'src/ai/tools/entities/virtual-company.entity';
import { Equal, MoreThan, Or, Repository } from 'typeorm';
import dayjs from 'dayjs';
import { EventsGateway } from 'src/events/events.gateway';

@Injectable()
export class DockerService {
  constructor(
    @Inject('DOCKER_INSTANCE')
    private docker: Docker,
    private configServer: ConfigService,
    @Inject('VIRTUAL_COMPANY_REPOSITORY')
    private virtualCompanyRepository: Repository<VirtualCompany>,
  ) { }

  async execJava(execCode: ExecCode, client: Socket) {
    const dir = tmp.dirSync({});
    const tmpFile = tmp.fileSync({
      dir: dir.name,
      name: 'main.' + execCode.codeType,
    });
    fs.writeFileSync(tmpFile.name, execCode.sourceCode);
    const dockerfileContent = `
      FROM openjdk:22
      COPY ${path.basename(tmpFile.name)} /app/
      WORKDIR /app
    `;
    const dockerfileTmp = tmp.fileSync({
      dir: dir.name,
      name: 'Dockerfile',
    });
    fs.writeFileSync(dockerfileTmp.name, dockerfileContent);
    if (!(await this.checkImage(CoderRunnerConstant.JAVA_RUNNER_IMAGE_NAME))) {
      await this.createImage(
        CoderRunnerConstant.JAVA_RUNNER_IMAGE_NAME,
        dockerfileTmp,
        tmpFile,
      );
    }
    try {
      let container: Docker.Container | null = await this.checkContainer(
        CoderRunnerConstant.JAVA_CONTAINER_NAME,
      );
      if (!container) {
        container = await this.createContainer(
          CoderRunnerConstant.JAVA_RUNNER_IMAGE_NAME,
          CoderRunnerConstant.JAVA_CONTAINER_NAME,
        );
      }
      await this.checkStatusAndStart(container);
      await this.copyFileContent(container, tmpFile);
      const exec = await container.exec({
        Cmd: ['java', `./${path.basename(tmpFile.name)}`],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
      });
      exec.start({ hijack: true, stdin: true, Tty: false }, (err, stream) => {
        if (err) return console.error(err);
        stream?.pipe(process.stderr);
        stream?.write(execCode.input);
        const stdout = new PassThrough();
        const stderr = new PassThrough();
        exec.modem.demuxStream(stream, stdout, stderr);
        stdout?.on('data', (chunk) => {
          client.emit('execRes', {
            status: ExecStatus.RUNNING,
            data: chunk.toString(),
          });
        });
        stderr?.on('data', (chunk) => {
          client.emit('execRes', {
            status: ExecStatus.ERROR,
            data: chunk.toString(),
          });
        });
        stream?.on('end', async function () {
          stream?.end();
          client.emit('execRes', {
            status: ExecStatus.FINISH,
            data: '执行完成',
          });
        });
      });
    } catch (error) {
      console.log('执行容器出错：', error.message);
      client.emit('execRes', {
        status: ExecStatus.ERROR,
        data: error.message,
      });
    } finally {
      tmpFile.removeCallback();
      dockerfileTmp.removeCallback();
      dir.removeCallback();
    }
  }

  async execPython(execCode: ExecCode, client: Socket) {
    const dir = tmp.dirSync({});
    const tmpFile = tmp.fileSync({
      dir: dir.name,
      name: 'main.py',
    });
    fs.writeFileSync(tmpFile.name, execCode.sourceCode);
    const dockerfileContent = `
      FROM python
      COPY ${path.basename(tmpFile.name)} /app/
      WORKDIR /app
    `;
    const dockerfileTmp = tmp.fileSync({
      dir: dir.name,
      name: 'Dockerfile',
    });
    fs.writeFileSync(dockerfileTmp.name, dockerfileContent);
    if (
      !(await this.checkImage(CoderRunnerConstant.PYTHON_RUNNER_IMAGE_NAME))
    ) {
      await this.createImage(
        CoderRunnerConstant.PYTHON_RUNNER_IMAGE_NAME,
        dockerfileTmp,
        tmpFile,
      );
    }
    try {
      let container: Docker.Container | null = await this.checkContainer(
        CoderRunnerConstant.PYTHON_CONTAINER_NAME,
      );
      if (!container) {
        container = await this.createContainer(
          CoderRunnerConstant.PYTHON_RUNNER_IMAGE_NAME,
          CoderRunnerConstant.PYTHON_CONTAINER_NAME,
        );
      }
      await this.checkStatusAndStart(container);
      await this.copyFileContent(container, tmpFile);
      const exec = await container.exec({
        Cmd: ['python', `./${path.basename(tmpFile.name)}`],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
      });
      exec.start({ hijack: true, stdin: true }, function (err, stream) {
        if (err) return console.error(err);
        stream?.write(execCode.input);
        const stdout = new PassThrough();
        const stderr = new PassThrough();
        exec.modem.demuxStream(stream, stdout, stderr);
        stdout?.on('data', (chunk) => {
          client.emit('execRes', {
            status: ExecStatus.RUNNING,
            data: chunk.toString(),
          });
        });
        stderr?.on('data', (chunk) => {
          client.emit('execRes', {
            status: ExecStatus.ERROR,
            data: chunk.toString(),
          });
        });

        stream?.on('end', async function () {
          stream?.end();
          client.emit('execRes', {
            status: ExecStatus.FINISH,
            data: '执行完成',
          });
        });
      });
    } catch (error) {
      console.log(error.message);
      client.emit('execRes', {
        status: ExecStatus.ERROR,
        data: error.message,
      });
    } finally {
      tmpFile.removeCallback();
      dockerfileTmp.removeCallback();
      dir.removeCallback();
    }
  }

  async execGcc(execCode: ExecCode, client: Socket) {
    const dir = tmp.dirSync({});
    const tmpFile = tmp.fileSync({
      dir: dir.name,
      name: 'main.' + execCode.codeType,
    });
    fs.writeFileSync(tmpFile.name, execCode.sourceCode);

    const dockerfileContent = `
      FROM gcc
      COPY ${path.basename(tmpFile.name)} /app/
      WORKDIR /app
    `;
    const dockerfileTmp = tmp.fileSync({
      dir: dir.name,
      name: 'Dockerfile',
    });
    fs.writeFileSync(dockerfileTmp.name, dockerfileContent);
    if (!(await this.checkImage(CoderRunnerConstant.GCC_RUNNER_IMAGE_NAME))) {
      await this.createImage(
        CoderRunnerConstant.GCC_RUNNER_IMAGE_NAME,
        dockerfileTmp,
        tmpFile,
      );
    }
    try {
      let container: Docker.Container | null = await this.checkContainer(
        CoderRunnerConstant.GCC_CONTAINER_NAME,
      );
      if (!container) {
        container = await this.createContainer(
          CoderRunnerConstant.GCC_RUNNER_IMAGE_NAME,
          CoderRunnerConstant.GCC_CONTAINER_NAME,
        );
      }
      await this.checkStatusAndStart(container);
      await this.copyFileContent(container, tmpFile);
      await this.gccCompile(container, tmpFile);
      const exec = await container.exec({
        Cmd: ['./main'],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
      });
      exec.start({ hijack: true, stdin: true }, function (err, stream) {
        if (err) return console.error(err);
        stream?.write(execCode.input);
        const stdout = new PassThrough();
        const stderr = new PassThrough();
        exec.modem.demuxStream(stream, stdout, stderr);
        stdout?.on('data', (chunk) => {
          client.emit('execRes', {
            status: ExecStatus.RUNNING,
            data: chunk.toString(),
          });
        });
        stderr?.on('data', (chunk) => {
          client.emit('execRes', {
            status: ExecStatus.ERROR,
            data: chunk.toString(),
          });
        });

        stream?.on('end', async function () {
          stream?.end();
          client.emit('execRes', {
            status: ExecStatus.FINISH,
            data: '执行完成',
          });
        });
      });
    } catch (error) {
      console.log(error.message);
      client.emit('execRes', {
        status: ExecStatus.ERROR,
        data: error.message,
      });
    } finally {
      tmpFile.removeCallback();
      dockerfileTmp.removeCallback();
      dir.removeCallback();
    }
  }

  async gccCompile(container: Container, tmpFile: tmp.FileResult) {
    const makeExec = await container.exec({
      Cmd: ['g++', `./${path.basename(tmpFile.name)}`, '-o', './main'],
      AttachStdout: true,
      AttachStderr: true,
    });
    let output = '';
    const back = await makeExec.start({});
    return new Promise((resolve, reject) => {
      back.on('end', (e: any) => {
        if (output === '') {
          resolve(e);
        } else {
          reject(new Error(output));
        }
      });
      back.on('error', (err: any) => {
        console.error('Error during command execution:', err);
        reject(err);
      });
      back.on('data', (e: any) => {
        output += e.toString();
      });
    });
  }

  execCode(execCode: ExecCode, client: Socket) {
    switch (execCode.codeType) {
      case CodeType.JAVA:
        this.execJava(execCode, client);
        break;
      case CodeType.PYTHON:
        this.execPython(execCode, client);
        break;
      case CodeType.CPP:
        this.execGcc(execCode, client);
        break;
    }
  }

  async copyFileContent(container: Docker.Container, tmpFile: tmp.FileResult) {
    try {
      const exec = await container.exec({
        Cmd: ['sh', '-c', `cat > /app/${path.basename(tmpFile.name)}`],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
      });
      const back = await exec.start({
        hijack: true,
        stdin: true,
      });
      back.write(fs.readFileSync(tmpFile.name).toString());
      back.end();
    } catch (error) {
      console.log('拷贝文件失败：' + error);
    }
  }

  async checkImage(imageName: string) {
    try {
      const image = this.docker.getImage(imageName);
      await image.inspect();
      return true;
    } catch (error) {
      console.log(`${imageName}不存在，正在构建`);
      return false;
    }
  }

  async createImage(
    imageName: string,
    dockerfileTmp: tmp.FileResult,
    tmpFile: tmp.FileResult,
  ) {
    try {
      let stream = await this.docker.buildImage(
        {
          context: path.dirname(dockerfileTmp.name),
          src: [path.basename(dockerfileTmp.name), path.basename(tmpFile.name)],
        },
        { t: imageName },
      );
      stream.on('data', (chunk) => {
        console.log(chunk.toString());
      });
      return new Promise((resolve, reject) => {
        this.docker.modem.followProgress(stream, (err, res) => {
          if (err) {
            console.error('Error building image:', err);
            reject(err);
          }
          resolve(res);
        });
      });
    } catch (error) {
      console.log('构建镜像出错：', error.message);
    }
  }

  async checkContainer(containerName: string) {
    const containers = await this.docker.listContainers({
      filters: {
        name: [containerName],
      },
    });
    const containerInfo = containers.find((c) => {
      return c.Names.includes('/' + containerName);
    });
    if (!containerInfo) return null;
    return this.docker.getContainer(containerInfo.Id);
  }

  async createContainer(imaegName: string, containerName: string) {
    return await this.docker.createContainer({
      Image: imaegName,
      Cmd: ['sh', '-c', 'while true; do sleep 1; done'],
      Tty: false,
      name: containerName,
    });
  }

  async checkStatusAndStart(container: Docker.Container) {
    const inspect = await container.inspect();
    if (inspect.State.Status !== 'running') {
      await container.start();
    }
  }

  async createVirCompany(user: User, virtualCompanyDTO: VirtualCompanyDTO) {
    if (!(await this.checkImage(VirCompanyConstant.IMAGE_NAME))) {
      try {
        await this.docker.pull(VirCompanyConstant.IMAGE_NAME);
      } catch (error) {
        console.log(error.message());
        console.error(
          `${VirCompanyConstant.IMAGE_NAME}安装失败，建议手动安装后重试`,
        );
        return;
      }
    }
    const configPath = this.configServer.get('VIRTUAL_COMPANY_CONFIG_PATH');
    if (!configPath) {
      console.error('请在.env文件中配置VIRTUAL_COMPANY_CONFIG_PATH');
      return;
    }
    const workerSpaceDir = VirCompanyConstant.WORKERSPACE_DIR + user.id;
    const container = await this.docker.createContainer({
      Image: VirCompanyConstant.IMAGE_NAME,
      Cmd: ['metagpt', virtualCompanyDTO.prompt],
      HostConfig: {
        Privileged: true,
        Binds: [
          `${configPath}:/app/metagpt/config/config2.yaml`,
          `${workerSpaceDir}:/app/metagpt/workspace`,
        ],
        AutoRemove: true,
      },
      AttachStdout: true,
      AttachStderr: true,
      AttachStdin: true,
    });
    await container.start();
    const stream = await container.attach({
      stream: true,
      stdout: true,
      stderr: true,
    });
    const vc = new VirtualCompany();
    vc.model = virtualCompanyDTO.model as string;
    vc.prompt = virtualCompanyDTO.prompt;
    vc.createTime = new Date();
    vc.taskStatus = TaskStatusEnum.RUNNING;
    vc.replyContent = '';
    vc.errorContent = '';
    vc.user = user;
    this.virtualCompanyRepository.save(vc);
    const stdout1 = new PassThrough();
    const stdout2 = new PassThrough();
    container.modem.demuxStream(stream, stdout1, stdout2);
    stdout1.on('data', (chunk) => {
      this.sendMsg(user, ExecStatus.RUNNING, chunk.toString());
      vc.replyContent += chunk.toString();
      this.virtualCompanyRepository.update(vc.id, vc);
    });
    stdout2.on('data', (chunk) => {
      this.sendMsg(user, ExecStatus.RUNNING, chunk.toString());
      vc.replyContent += chunk.toString();
      this.virtualCompanyRepository.update(vc.id, vc);
    });

    stream.on('end', () => {
      this.sendMsg(user, ExecStatus.FINISH, '');
      vc.endTime = new Date();
      vc.taskStatus = TaskStatusEnum.SUCCEEDED;
      this.virtualCompanyRepository.update(vc.id, vc);
    });
  }

  sendMsg(user: User, status: ExecStatus, data: string) {
    const client = EventsGateway.webClient.get(user.id);
    if (client) {
      client.emit('vcWorking', {
        status,
        data,
      });
    } 
  }
}
