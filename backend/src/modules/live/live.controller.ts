import { Controller, Get } from '@nestjs/common';
import { LiveService } from './live.service';

@Controller('live')
export class LiveController {
  constructor(private svc: LiveService) {}
  @Get('status')   status()   { return this.svc.getStatus(); }
  @Get('stream')   stream()   { return this.svc.getStream(); }
  @Get('upcoming') upcoming() { return this.svc.getUpcoming(); }
}
