import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClientInitializationError } from '@prisma/client/runtime/client';
import { PrismaClient } from '../../../generated/prisma/client';
import { ConfigService } from '../config/config.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleDestroy, OnModuleInit
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    super({
      adapter: new PrismaPg({
        connectionString: configService.DATABASE_URL,
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();

      this.logger.debug('Connected to database');
    } catch (e) {
      if (e instanceof PrismaClientInitializationError) {
        this.logger.fatal('Error connecting to database: ' + e.message);
      } else {
        this.logger.fatal(
          'Unexpected error connecting to database: ' + e.stack,
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
