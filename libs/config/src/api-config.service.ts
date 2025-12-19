import { Injectable } from '@nestjs/common';
import { BaseConfigService } from './base-config.service';

@Injectable()
export class ApiConfigService extends BaseConfigService {
  get PORT(): number {
    return this.configService.getOrThrow<number>('API_PORT');
  }
}
