import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { MomentsService } from './moments.service';
import { MomentType } from './moment.entity';

@Controller('moments')
export class MomentsController {
  constructor(private svc: MomentsService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.svc.findAll(page, limit);
  }

  @Get('declarations')
  declarations(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.svc.findByType(MomentType.DECLARATION, page, limit);
  }

  @Get('prayers')
  prayers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.svc.findByType(MomentType.PRAYER, page, limit);
  }

  @Get('testimonies')
  testimonies(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.svc.findByType(MomentType.TESTIMONY, page, limit);
  }

  /**
   * GET /moments/suggestions?momentId=1&youtubeId=abc&type=declaration&limit=8
   * Returns related clips: same-video first, then same-type from other sermons.
   */
  @Get('suggestions')
  suggestions(
    @Query('momentId', new DefaultValuePipe(0), ParseIntPipe) momentId: number,
    @Query('youtubeId') youtubeId: string,
    @Query('type') type: MomentType,
    @Query('limit', new DefaultValuePipe(8), ParseIntPipe) limit: number,
  ) {
    return this.svc.findSuggestions(momentId, youtubeId, type, limit);
  }
}
