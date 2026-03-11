import { Controller, Get, Post, Delete, Param, Query, UseGuards, Body, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private svc: EventsService) {}
  @Get()                findAll(@Query('type') type?: string) { return this.svc.findAll(type); }
  @Get('upcoming')      findUpcoming() { return this.svc.findUpcoming(); }
  @Get(':id')           findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }
  @Get(':id/countdown') countdown(@Param('id', ParseIntPipe) id: number) { return this.svc.getCountdown(id); }
  @Post()               @UseGuards(AuthGuard('jwt')) create(@Body() b: any) { return this.svc.create(b); }
  @Post(':id')          @UseGuards(AuthGuard('jwt')) update(@Param('id', ParseIntPipe) id: number, @Body() b: any) { return this.svc.update(id, b); }
  @Delete(':id')        @UseGuards(AuthGuard('jwt')) remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
