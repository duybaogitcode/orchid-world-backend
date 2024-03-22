import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { GoShipService } from './utils/goship';
import { address } from './user/user.definition';
const paypal = require('@paypal/checkout-server-sdk');
const paypalout = require('@paypal/payouts-sdk');
const twillo = require('twilio');

@Injectable()
export class AppService {
  private client: any;
  private clientout: any;

  constructor(private readonly goshipService: GoShipService) {
    const clientId =
      'AXYpMOBg9oGL9_tWWf7P53A0XYoK-OR178XB_IQHoPkgcyhHhjDlx4j2bBSbQ0N-hwUVQimiCbkU7HHp';
    const client_secret =
      'EF5_abi3QEikdUufQPBAF9CCii_tmj1v-JUqr-8KVg0X4xK2vEM4EHzI8pzFP250YgLlXEebC__QmBSL';
    const environment = new paypal.core.SandboxEnvironment(
      clientId,
      client_secret,
    );
    this.client = new paypal.core.PayPalHttpClient(environment);

    const payoutEvironment = new paypalout.core.SandboxEnvironment(
      clientId,
      client_secret,
    );
    this.clientout = new paypalout.core.PayPalHttpClient(payoutEvironment);
  }

  getHello(): string {
    // this.getCapture('94310278VV511143N');
    // this.createPayout();
    // this.sendSMS();
    return 'Hello World!';
  }

  // async getCapture(captureId: string) {
  //   // const request1 = new paypal.payouts.PayoutsPostRequest();
  //   // const request = new paypal.orders.OrdersGetRequest(captureId);
  //   try {
  //     // const response = await this.client.execute(request);
  //     // console.log(
  //     //   response.result.status,
  //     //   response.result.purchase_units[0].amount.value,
  //     //   response.result.purchase_units[0].description,
  //     // );
  //     // // if (response.result.status === 'COMPLETED') {
  //     // //   console.log('Payment not completed');
  //     // // }
  //     // return response.result;

  //     const address = {
  //       city: '700000',
  //       district: '720300',
  //       ward: '12654',
  //       detail: '123/4/5',
  //     };

  //     let addressString = '';
  //     if (address.city) {
  //       const listCity = await this.goshipService.getCities();
  //       const city = listCity.data.find((c) => c.id === address.city);
  //       const cityName = city?.name || '';
  //       addressString += cityName;
  //       if (address.district) {
  //         const listDistrict = await this.goshipService.getDistricts(
  //           address.city,
  //         );
  //         const district = listDistrict.data.find(
  //           (d) => d.id === address.district,
  //         );
  //         const districtName = district?.name || '';
  //         addressString += ' ' + districtName;
  //         if (address.ward) {
  //           const listWard = await this.goshipService.getWards(
  //             address.district,
  //           );
  //           const ward = listWard.data.find(
  //             (w) => w.id.toString() === address.ward,
  //           );
  //           const wardName = ward?.name || '';
  //           addressString += ' ' + wardName;
  //         }
  //       }
  //     }

  //     console.log(addressString);
  //     throw new Error('Error');
  //   } catch (err) {
  //     console.error(err);
  //     throw err;
  //   }
  // }

  async createPayout() {
    const bactchId = uuidv4();

    try {
      const request = new paypalout.payouts.PayoutsPostRequest();
      request.requestBody({
        sender_batch_header: {
          recipient_type: 'EMAIL',
          email_message: 'Rút tiền',
          note: 'Rút tiền từ Orchid Wallet!',
          sender_batch_id: bactchId,
          email_subject: 'Transaction from Orchid',
        },
        items: [
          {
            note: 'Your 1$ Payout!',
            amount: {
              currency: 'USD',
              value: '5.00',
            },
            receiver: 'sb-hhjli29689413@personal.example.com',
            sender_item_id: bactchId,
          },
        ],
      });

      const result = await this.clientout.execute(request);
      console.log(result);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async sendSMS() {
    const accountSid = 'ACaf12ebf351b3e1d193b0a218c31e17df';
    const authToken = 'eed6de97531f3a93db23f17eeae7fa67';
    const client = require('twilio')(accountSid, authToken);

    client.messages
      .create({
        body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
        from: '+15642167949', // replace with your Twilio number
        to: '+84888739149', // replace with the Vietnamese number
      })
      .then((message) => console.log(message.sid))
      .catch((error) => console.error(error));
  }
}
