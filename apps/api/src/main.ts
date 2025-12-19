import { ApiConfigService } from '@config';
import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);

  const PORT = app.get(ApiConfigService).PORT;

  await app.listen(PORT);
}
bootstrap();
