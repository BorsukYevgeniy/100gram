import { ConfigModule } from '@config';
import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';

@Module({
  imports: [ConfigModule.forApi()],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
