import { Injectable } from '@nestjs/common';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';

@Injectable()
export class FirebaseFCMService {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
  ) {}

  async sendNotification() {
    const message = {
      notification: {
        title: 'Title of your notification',
        body: 'Body of your notification',
      },
      token:
        'AAAAN6_J6mc:APA91bHKDh4w2SEO0EG_PXHluRSowD5ztjzQq5KjzZVU8zsrJ3MsfivyA-xo8zgIU_ge1Urec9axm1nprx7qOulB88piN3qRQ1lbtJAkiauGjXS-v-sns3wo-yh7ihTiI3Eo2BhjsDZ2',
    };

    try {
      const response = await this.firebase.messaging.send(message);
      console.log('Successfully sent message:', response);
    } catch (error) {
      console.log('Error sending message:', error);
    }
  }
}
