import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClientInitializationError } from '@prisma/client/runtime/client';
import { PinoLogger } from 'nestjs-pino';
import { Pool } from 'pg';
import { PrismaClient } from '../../../generated/prisma/client';
import databaseConfig from '../../config/database.config';
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleDestroy, OnModuleInit
{
  constructor(
    @Inject(databaseConfig.KEY) config: ConfigType<typeof databaseConfig>,
    private readonly logger: PinoLogger,
  ) {
    console.log(config);
    super({
      adapter: new PrismaPg(
        new Pool({
          connectionString: config.databaseUrl,
        }),
      ),
    });

    this.logger.setContext(PrismaService.name);
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();

      await this.$queryRaw`SELECT 1`;

      this.logger.debug('Connected to database');
    } catch (e) {
      if (e instanceof PrismaClientInitializationError) {
        this.logger.fatal('Error connecting to database: ' + e.message);
      } else {
        this.logger.fatal(
          'Unexpected error connecting to database: ' +
            (e as PrismaClientInitializationError).stack,
        );
      }
      throw e;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();

      this.logger.debug('Disconnected from database');
    } catch (e) {
      this.logger.fatal('Unexpected error disconnecting from database');
      throw e;
    }
  }
}
