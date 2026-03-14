import { Controller, Get, Query } from '@nestjs/common';
import { MomentsService } from './moments.service';
import { MomentType } from './moment.entity';

@Controller('moments')
export class MomentsController {
  constructor(private svc: MomentsService) {}

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.svc.findAll(+page, +limit);
  }

  @Get('declarations')
  declarations(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.svc.findByType(MomentType.DECLARATION, +page, +limit);
  }

  @Get('prayers')
  prayers(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.svc.findByType(MomentType.PRAYER, +page, +limit);
  }

  @Get('testimonies')
  testimonies(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.svc.findByType(MomentType.TESTIMONY, +page, +limit);
  }
}
