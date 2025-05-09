import { DataSource } from 'typeorm';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'mysql',
        host: process.env.MYSQL_HOST,
        // host: '47.99.113.58',
        port: 3306,
        username: process.env.MYSQL_USERNAME,
        // password: 'asd1245+asd',
        password: process.env.MYSQL_PASSWORD,
        database: 'light_ai',
        entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
        synchronize: true,
      });

      return dataSource.initialize();
    },
  },
];
