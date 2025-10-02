import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigClientService } from './config/config-client.service';

@Module({
  imports: [HttpModule],
  providers: [ConfigClientService],
  exports: [ConfigClientService],
})
export class AppModule {}
