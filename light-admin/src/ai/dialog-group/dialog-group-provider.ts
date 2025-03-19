import { DataSource } from 'typeorm';
import { DialogGroup } from './entities/dialog-group.entity';

export const dialogGroupProviders = [
  {
    provide: 'DIALOG_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(DialogGroup),
    inject: ['DATA_SOURCE'],
  },
];
