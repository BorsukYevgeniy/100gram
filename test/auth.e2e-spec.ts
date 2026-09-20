import { ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { hashSync } from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { randomInt } from 'crypto';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import authConfig from '../src/config/auth.config';
import databaseConfig from '../src/config/database.config';
import pinoConfig from '../src/config/pino.config';
import { PrismaModule } from '../src/infra/prisma/prisma.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { AuthModule } from '../src/modules/auth/auth.module';
import { LoginDto } from '../src/modules/auth/dto/login.dto';
import { ResetPasswordDto } from '../src/modules/auth/dto/reset-password.dto';
import { CreateUserDto } from '../src/modules/user/dto/create-user.dto';

describe('AuthController (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let passwordSalt: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        PrismaModule,
        LoggerModule.forRootAsync({
          imports: [ConfigModule.forFeature(pinoConfig)],
          inject: [pinoConfig.KEY],
          useFactory: (c: ConfigType<typeof pinoConfig>) => c,
        }),
        ConfigModule.forRoot({
          envFilePath: '.env.test',
        }),
        ConfigModule.forFeature(databaseConfig),
      ],
      providers: [PrismaService],
    }).compile();

    app = moduleFixture.createNestApplication();

    const authConf = app.get<ConfigType<typeof authConfig>>(authConfig.KEY);

    passwordSalt = authConf.passwordSalt;

    prisma = app.get<PrismaService>(PrismaService);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.use(cookieParser());
    app.useLogger(false);

    await prisma.user.deleteMany();
    await prisma.token.deleteMany();

    await app.init();
  }, 10_000);

  describe('POST /auth/register - Should register a new user', () => {
    it.each<[string, 201 | 400, CreateUserDto]>([
      [
        'POST /auth/register - 201 CREATED - Should register a new user',
        201,
        {
          email: 'user@gmail.com',
          nickname: 'user',
          password: 'password',
        },
      ],
      [
        'POST /auth/register - 400 BAD REQUEST - Should return 400 http code because user already exists',
        400,
        {
          email: 'user@gmail.com',
          nickname: 'user',
          password: 'password',
        },
      ],
      [
        'POST /auth/register - 400 BAD REQUEST - Should return 400 http code because email not valid',
        400,
        { email: 'user', nickname: 'user', password: 'password' },
      ],
      [
        'POST /auth/register - 400 BAD REQUEST - Should return 400 http code because nickname not valid',
        400,
        { email: 'user1@gmail.com', nickname: 'us', password: 'password' },
      ],
      [
        'POST /auth/register - 400 BAD REQUEST - Should return 400 http code because password not valid',
        400,
        { email: 'user1@gmail.com', nickname: 'user1', password: 'user' },
      ],
      [
        'POST /auth/register - 400 BAD REQUEST - Should return 400 http code because data not valid',
        400,
        { email: 'user', nickname: 'us', password: 'user' },
      ],
    ])('%s', async (_, statusCode, CreateUserDto) => {
      const { headers } = await request(app.getHttpServer())
        .post('/auth/register')
        .send(CreateUserDto)
        .expect(statusCode);

      if (statusCode === 201) {
        expect(headers['set-cookie']).toEqual([
          expect.any(String),
          expect.any(String),
        ]);
      }
    });
  });

  let accessToken: string, refreshToken: string;
  describe('POST /auth/login - Should login a user', () => {
    it.each<[string, 200 | 400 | 404, LoginDto]>([
      [
        'POST /auth/login - 200 OK - Should login a user',
        200,
        { email: 'user@gmail.com', password: 'password' },
      ],
      [
        'POST /auth/login - 400 BAD REQUEST - Should return 400 HTTP code because client send invalid credentials',
        400,
        { email: 'user1@gmail.com', password: 'password' },
      ],
      [
        'POST /auth/login - 400 BAD REQUEST - Should return 400 HTTP code because email not valid',
        400,
        { email: 'use', password: 'password' },
      ],
      [
        'POST /auth/login - 400 BAD REQUEST - Should return 400 HTTP code because password not valid',
        400,
        { email: 'user1@gmail.com', password: 'pass' },
      ],
      [
        'POST /auth/login - 400 BAD REQUEST - Should return 400 HTTP code because data not valid',
        400,
        { email: 'user', password: 'pass' },
      ],
    ])('%s', async (_, statusCode, loginUserDto) => {
      const { headers } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginUserDto)
        .expect(statusCode);

      if (statusCode === 200) {
        const cookies = headers['set-cookie'];

        accessToken = cookies[0].split('=')[1].split(';')[0];
        refreshToken = cookies[1].split('=')[1].split(';')[0];
      }
    });
  });

  describe('POST /auth/refresh - Should refresh pair of tokens', () => {
    it('200 OK - Should refresh pair of tokens', async () => {
      const { headers } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', `refresh_token=${refreshToken}`)
        .expect(200);

      refreshToken = headers['set-cookie'][1].split('=')[1].split(';')[0];
    });

    it('401 UNAUTHORIZED - Should return 401 code because token is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', 'refresh_token=1')
        .expect(401);
    });
  });

  describe('POST /auth/verify - Should verify a user', () => {
    let verificationCode: string;
    beforeAll(async () => {
      verificationCode = (
        await prisma.user.findUnique({
          where: { email: 'user@gmail.com' },
        })
      ).verificationCode;
    });

    it('POST /auth/verify - 200 OK - Should verify user', async () => {
      await request(app.getHttpServer())
        .post(`/auth/verify/${verificationCode}`)
        .expect(200);
    });

    it('POST /auth/verify - 400 BAD REQUEST - Should return 400 because user is already verified', async () => {
      await request(app.getHttpServer())
        .post(`/auth/verify/${verificationCode}`)
        .expect(400);
    });

    it('POST /auth/verify - 404 NOT FOUND - Should return 404 if user does not exist', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('POST /auth/resend-verification-email - Should resend verification email', () => {
    it('POST /auth/resend-verification-email - 200 OK - Should resend verification email', async () => {
      await request(app.getHttpServer())
        .post('/auth/resend-verification-email')
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(200);
    });

    it('POST /auth/resend-verification-email - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      await request(app.getHttpServer())
        .post('/auth/resend-verification-email')
        .expect(401);
    });
  });

  describe('POST /auth/send-otp-email - Should send email with otp', () => {
    it('POST /auth/send-otp-email - 200 OK - Should send email with otp', async () => {
      await request(app.getHttpServer())
        .post('/auth/send-otp-email')
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(200);
    });

    it('POST /auth/send-otp-email - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      await request(app.getHttpServer())
        .post('/auth/send-otp-email')
        .expect(401);
    });
  });

  const otp = randomInt(100_000, 1_000_000);
  describe('POST /auth/reset-password - Should reset password', () => {
    beforeAll(async () => {
      await prisma.user.updateMany({
        where: { tokens: { some: { token: refreshToken } } },
        data: { otpHash: hashSync(otp.toString(), passwordSalt) },
      });
    });

    it('POST /auth/reset-password - 400 BAD REQUEST - Should return 400 code because otp is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          code: otp + 1,
          newPassword: 'strongPassword',
        })
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(400);
    });

    it('POST /auth/reset-password - 200 OK - Should reset password of user', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          code: otp,
          newPassword: 'strongPassword',
        })
        .expect(200)
        .set('Cookie', [`access_token=${accessToken}`]);
    });

    // Tests for dto validation and authorization of user
    it.each<[string, 400 | 401, ResetPasswordDto]>([
      [
        'POST /auth/reset-password - 400 BAD REQUEST - Should return 400 http code because code is invalid',
        400,
        {
          code: 123_56,
          newPassword: 'veryStrongPassword',
        },
      ],
      [
        'POST /auth/reset-password - 400 BAD REQUEST - Should return 400 http code because newPassword is invalid',
        400,
        {
          code: 123_456,
          newPassword: '1234',
        },
      ],
      [
        'POST /auth/reset-password - 400 BAD REQUEST - Should return 400 http code because dto isnt valid',
        400,
        {
          code: 123,
          newPassword: '123',
        },
      ],
      [
        'POST /auth/reset-password - 400 BAD REQUEST - Should return 401 http code because user is unauthorized',
        401,
        {
          code: 123_456,
          newPassword: 'veryStrongPassword',
        },
      ],
    ])('%s', async (_, statusCode, dto) => {
      const r = request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(dto)
        .expect(statusCode);

      statusCode === 400
        ? await r.set('Cookie', [`access_token=${accessToken}`])
        : await r;
    });
  });

  describe('POST /auth/logout - Should logout a user', () => {
    it('POST /auth/logout - 200 OK - Should logout a user', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', [
          `refresh_token=${refreshToken}; access_token=${accessToken}`,
        ])
        .expect(204);
    });

    it('401 UNAUTHORIZED - Should return 401 code because client is unauthorized', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', 'refresh_token=1')
        .expect(401);
    });
  });

  describe('POST /auth/logout-all - Should logout a user from all devices', () => {
    it('POST /auth/logout-all - 200 OK - Should logout a user from all devices', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(204);
    });

    it('401 UNAUTHORIZED - Should return 401 code because client is unauthorized', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('Cookie', 'access_token=1')
        .expect(401);
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.token.deleteMany();
    await app.close();
  });
});
