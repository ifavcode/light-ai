import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/common/metadata';
import R from 'src/common/R';
import {
  CodeType,
  CodeTypeCn,
  ModelType,
  ModelTypeCN,
  ModelTypeVersion,
} from 'src/types';

@Controller('setting')
export class SettingController {
  @Get('aiAllowList')
  @Public()
  aiAllowList() {
    return R.okD(
      Object.values(ModelType).map((type) => {
        return {
          label: ModelTypeCN[type],
          value: type,
          model: ModelTypeVersion[type],
        };
      }),
    );
  }

  @Get('language')
  @Public()
  language() {
    return R.okD(
      Object.values(CodeType).map((type) => {
        return {
          label: CodeTypeCn[type],
          value: type,
        };
      }),
    );
  }
}
