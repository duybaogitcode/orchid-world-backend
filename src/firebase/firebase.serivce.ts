import { Injectable } from '@nestjs/common';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import * as stream from 'stream';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';
import { FileUpload } from 'graphql-upload-ts';

@Injectable()
export class FirebaseService {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
  ) {}

  async uploadFile(fileUpload: FileUpload, path: string): Promise<string> {
    try {
      const { createReadStream } = fileUpload;

      const bucket = this.firebase.storage.bucket('orchid-fer.appspot.com');

      const fileName = path + '/' + uuidv4() + '.webp';
      const file = bucket.file(fileName);
      const writeStream = file.createWriteStream({
        metadata: {
          contentType: 'image/webp',
        },
      });

      const fileBuffer = await new Promise((resolve, reject) => {
        const chunks = [];
        createReadStream()
          .on('data', (chunk) => chunks.push(chunk))
          .on('error', reject)
          .on('end', () => resolve(Buffer.concat(chunks)));
      });

      const convertedImageBuffer = await sharp(fileBuffer)
        .toFormat('webp')
        .toBuffer();

      return new Promise((resolve, reject) => {
        const bufferStream = new stream.PassThrough();
        bufferStream.end(convertedImageBuffer);
        bufferStream
          .pipe(writeStream)
          .on('error', (error) => {
            console.error('Error uploading file:', error);
            reject('Error uploading file');
          })
          .on('finish', async () => {
            console.log('File uploaded successfully');

            const [url] = await file.getSignedUrl({
              action: 'read',
              expires: '03-09-2491',
            });

            resolve(url);
          });
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Error uploading file');
    }
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const bucket = this.firebase.storage.bucket('orchid-fer.appspot.com');
      const filePath = this.convertToRelativePath(url);
      await bucket.file(filePath).delete();
      console.log('File path' + filePath);
      console.log('File removed successfully.');
    } catch (error) {
      console.error('Error removing file:', error.message);
      throw new Error('Failed to remove file.');
    }
  }

  private convertToRelativePath(url: string): string {
    const firebaseUrl =
      'https://storage.googleapis.com/orchid-fer.appspot.com/';
    const startIndex = url.indexOf(firebaseUrl);
    if (startIndex !== -1) {
      const filePath = url.substring(startIndex + firebaseUrl.length);
      return filePath.split('?')[0];
    } else {
      throw new Error('Invalid URL format');
    }
  }
}
