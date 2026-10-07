import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(configService: ConfigService) {
    const cloudinaryUrl = configService.get<string>('CLOUDINARY_URL');

    if (!cloudinaryUrl) {
      throw new Error('CLOUDINARY_URL is not configured');
    }

    const credentials = new URL(cloudinaryUrl);

    cloudinary.config({
      cloud_name: credentials.hostname,
      api_key: decodeURIComponent(credentials.username),
      api_secret: decodeURIComponent(credentials.password),
      secure: true,
    });
  }

  uploadImage(filePath: string, folder = 'pickstage') {
    return cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
    });
  }

  uploadBuffer(buffer: Buffer, folder = 'pickstage') {
    return new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
          },
          (error, result) => {
            if (error || !result) {
              reject(
                error instanceof Error
                  ? error
                  : new Error(
                      typeof error === 'string'
                        ? error
                        : 'Cloudinary upload failed',
                    ),
              );
              return;
            }

            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          },
        );

        stream.end(buffer);
      },
    );
  }
}
