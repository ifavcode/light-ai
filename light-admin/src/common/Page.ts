import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class Page {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? parseInt(value) : 1))
  pageNum: number = 1;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? parseInt(value) : 10))
  pageSize: number = 10;

  total: number = 0;

  totalPage: number;

  list: any;

  public setList(list: any) {
    this.totalPage = Math.ceil(this.total / this.pageSize);
    this.list = list;
  }

  public getSkip() {
    return (this.pageNum - 1) * this.pageSize;
  }
}
