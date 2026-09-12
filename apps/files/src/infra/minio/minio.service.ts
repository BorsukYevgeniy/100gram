import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigType } from '@nestjs/config';
import minioConfig from '../../config/minio.config';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: S3Client;

  constructor(
    @Inject(minioConfig.KEY)
    private readonly config: ConfigType<typeof minioConfig>,
  ) {
    const { bucket, ...minioConf } = config;

    this.minioClient = new S3Client(minioConf);
  }

  async upload(buffer: Buffer, key: string) {
    return await this.minioClient.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'image/jpeg',
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.minioClient.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }),
    );
  }

  async get(key: string): Promise<string> {
    const { Body } = await this.minioClient.send(
      new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }),
    );

    return await Body.transformToString('base64');
  }

  async onModuleInit() {
    const bucket = this.config.bucket;

    try {
      await this.minioClient.send(
        new HeadBucketCommand({
          Bucket: bucket,
        }),
      );

      console.log(`Bucket "${bucket}" already exists`);
    } catch {
      await this.minioClient.send(
        new CreateBucketCommand({
          Bucket: bucket,
        }),
      );

      console.log(`Bucket "${bucket}" created`);
    }
  }
}
