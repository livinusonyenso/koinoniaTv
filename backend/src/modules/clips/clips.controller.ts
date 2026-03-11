import { Controller, Get, Post, Delete, Param, Query, UseGuards, Body, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClipsService } from './clips.service';

@Controller('clips')
export class ClipsController {
  constructor(private svc: ClipsService) {}
  @Get()            findAll(@Query('page') p = 1, @Query('limit') l = 20) { return this.svc.findAll(+p, +l); }
  @Get('featured')  findFeatured() { return this.svc.findFeatured(); }
  @Get(':id')       findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }
  @Post(':id/share') share(@Param('id', ParseIntPipe) id: number) { return this.svc.incrementShare(id); }
  @Post()           @UseGuards(AuthGuard('jwt')) create(@Body() body: any) { return this.svc.create(body); }
}
