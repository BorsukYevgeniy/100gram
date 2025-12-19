import { ConfigModule } from '@config';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule.forApi()],
})
export class ApiModule {}
