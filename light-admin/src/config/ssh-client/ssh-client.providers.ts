import { Client } from 'ssh2';

export const sshClientProviders = [
  {
    provide: 'SSH_CLIENT_SOURCE',
    useFactory: async () => {
      const conn = new Client();
      conn
        .on('ready', () => {
          console.log('Client 47.99.113.58 :: ready');
        })
        .connect({
          host: '47.99.113.58',
          port: 22,
          username: 'root',
          password: 'asd1245+asd',
        });
      return conn;
    },
  },
  {
    provide: 'SSH_CLIENT_SOURCE_SPEC',
    useFactory: async () => {
      const conn = new Client();
      conn
        .on('ready', () => {
        })
        .connect({
          host: '47.99.113.58',
          port: 22,
          username: 'root',
          password: 'asd1245+asd',
        });
      return conn;
    },
  },
];
