import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: 'apps/files/.env',
      isGlobal: true,
    }),
    FilesModule,
  ],
})
export class AppModule {}
