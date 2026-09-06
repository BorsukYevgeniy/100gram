import { registerAs } from '@nestjs/config';

export default registerAs('minio', () => ({
  endpoint: process.env.minioEndpoint,
  region: process.env.minioRegion,
  credentials: {
    accessKeyId: process.env.minioAccessKey,
    secretAccessKey: process.env.minioSecretKey,
  },
  bucket: process.env.minioBucket,
}));
