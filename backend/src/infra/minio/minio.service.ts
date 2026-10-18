import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import minioConfig from '../../config/minio.config';

@Injectable()
export class MinioService implements OnModuleInit {
  private s3: S3Client;
  private bucket: string;

  constructor(
    @Inject(minioConfig.KEY)
    { bucket, ...minioConf }: ConfigType<typeof minioConfig>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MinioService.name);

    this.bucket = bucket;
    this.s3 = new S3Client(minioConf);
  }

  async onModuleInit() {
    try {
      await this.s3.send(
        new HeadBucketCommand({
          Bucket: this.bucket,
        }),
      );

      this.logger.debug({ bucket: this.bucket }, 'Bucket exist');
    } catch {
      await this.s3.send(
        new CreateBucketCommand({
          Bucket: this.bucket,
        }),
      );

      this.logger.debug({ bucket: this.bucket }, 'Bucket created');
    }
  }

  async get(key: string) {
    try {
      const file = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      return {
        body: file.Body,
        contentType: file.ContentType ?? 'application/octet-stream',
        contentLength: file.ContentLength,
      };
    } catch (e: unknown) {
      if (e instanceof NoSuchKey) {
        throw e;
      }

      this.logger.error(
        `Failed to get file from MinIO: ${key}`,
        e instanceof Error ? e.stack : String(e),
      );

      throw e;
    }
  }
  async upload(key: string, content: Buffer, contentType: string) {
    try {
      await this.s3.send(
        new PutObjectCommand({
          Key: key,
          Bucket: this.bucket,
          Body: content,
          ContentType: contentType,
        }),
      );

      this.logger.debug({ key }, 'File uploaded');
    } catch (e) {
      this.logger.error({ key }, 'Cannot upload file');
      throw e;
    }
  }

  async delete(key: string) {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.logger.debug({ key }, 'File deleted');
    } catch (e) {
      this.logger.error({ key }, 'Cannot delete file');
      throw e;
    }
  }
}
