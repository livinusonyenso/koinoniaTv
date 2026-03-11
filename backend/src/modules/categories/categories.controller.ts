import {
  Controller, Get, Post, Param, Query, Body, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CategoriesService } from './categories.service';

@Controller()
export class CategoriesController {
  constructor(private svc: CategoriesService) {}

  @Get('categories')
  findAll() { return this.svc.findAll(); }

  @Get('categories/:slug')
  findOne(@Param('slug') slug: string) { return this.svc.findBySlug(slug); }

  @Get('categories/:slug/videos')
  findVideos(
    @Param('slug') slug: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) { return this.svc.findVideosByCategory(slug, +page, +limit); }

  @Post('categories')
  @UseGuards(AuthGuard('jwt'))
  create(@Body() body: any) { return this.svc.create(body); }

  @Post('videos/:id/categories')
  @UseGuards(AuthGuard('jwt'))
  assignCategories(
    @Param('id', ParseIntPipe) id: number,
    @Body('categoryIds') categoryIds: number[],
  ) { return this.svc.assignCategories(id, categoryIds); }
}
