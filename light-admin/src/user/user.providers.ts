import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRecord } from './entities/user-record.entity';

export const userProviders = [
  {
    provide: 'USER_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'USER_RECORD_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(UserRecord),
    inject: ['DATA_SOURCE'],
  },
]; 