import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { Readable } from 'stream';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { FileController } from './file.controller';
import { FileService } from './file.service';

type FileContent = NonNullable<
  Awaited<ReturnType<FileService['getFileContent']>>
>;

describe('FileController', () => {
  let controller: FileController;
  let fileService: FileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        {
          provide: FileService,
          useValue: { getFileContent: jest.fn() },
        },
      ],
    })
      .overrideGuard(VerifiedUserGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<FileController>(FileController);
    fileService = module.get<FileService>(FileService);
  });

  it('returns the file content as a stream with content headers', async () => {
    const key = 'attachments/example.png';
    const content = Buffer.from('file-content');
    const contentType = 'image/png';
    const response = { setHeader: jest.fn() } as unknown as Response;
    jest.spyOn(fileService, 'getFileContent').mockResolvedValue({
      body: Readable.from([content]) as unknown as FileContent['body'],
      contentType,
      contentLength: content.length,
    });

    const result = await controller.getFileContent(key, response);

    expect(fileService.getFileContent).toHaveBeenCalledWith(key);
    expect(response.setHeader).toHaveBeenNthCalledWith(
      1,
      'Content-Type',
      contentType,
    );
    expect(response.setHeader).toHaveBeenNthCalledWith(
      2,
      'Content-Length',
      content.length,
    );
    expect(result.getHeaders()).toEqual({
      type: contentType,
      disposition: undefined,
      length: content.length,
    });

    const chunks: Buffer[] = [];
    for await (const chunk of result.getStream()) {
      chunks.push(Buffer.from(chunk));
    }
    expect(Buffer.concat(chunks)).toEqual(content);
  });

  it('omits the content length header when the length is unknown', async () => {
    const response = { setHeader: jest.fn() } as unknown as Response;
    jest.spyOn(fileService, 'getFileContent').mockResolvedValue({
      body: Readable.from([
        Buffer.from('streamed-content'),
      ]) as unknown as FileContent['body'],
      contentType: 'application/octet-stream',
      contentLength: undefined,
    });

    await controller.getFileContent('attachments/stream.bin', response);

    expect(response.setHeader).toHaveBeenCalledTimes(1);
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/octet-stream',
    );
  });
});
