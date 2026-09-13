import { ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import appConfig from './config/app.config';

import { AsyncApiDocumentBuilder, AsyncApiModule } from 'nestjs-asyncapi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.use(cookieParser());

  const appConf = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const config = new DocumentBuilder()
    .setTitle('100Gram docs')
    .setDescription('The 100Gram REST API description')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup(
    'http-docs',
    app,
    SwaggerModule.createDocument(app, config),
  );

  const asyncApiConfig = new AsyncApiDocumentBuilder()
    .setTitle('100Gram docs')
    .setDescription(
      `
The 100Gram WebSocket API.

Authentication:
A valid access_token and refresh_cookie cookie must be sent during the WebSocket handshake.
`,
    )
    .setVersion('1.0')
    .build();

  await AsyncApiModule.setup(
    '/ws-docs',
    app,
    AsyncApiModule.createDocument(app, asyncApiConfig),
  );

  await app.listen(appConf.appPort);
}

bootstrap();
