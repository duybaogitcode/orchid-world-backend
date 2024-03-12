import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { GoShipService } from './utils/goship';
import { address } from './user/user.definition';
const paypal = require('@paypal/checkout-server-sdk');
const paypalout = require('@paypal/payouts-sdk');

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
    this.getCapture('94310278VV511143N');
    // this.createPayout();
    return 'Hello World!';
  }

  async getCapture(captureId: string) {
    // const request1 = new paypal.payouts.PayoutsPostRequest();
    // const request = new paypal.orders.OrdersGetRequest(captureId);
    try {
      // const response = await this.client.execute(request);
      // console.log(
      //   response.result.status,
      //   response.result.purchase_units[0].amount.value,
      //   response.result.purchase_units[0].description,
      // );
      // // if (response.result.status === 'COMPLETED') {
      // //   console.log('Payment not completed');
      // // }
      // return response.result;

      const address = {
        city: '700000',
        district: '72030011',
        ward: '1265411',
        detail: '123/4/5',
      };

      const listCity = await this.goshipService.getCities();
      const city = listCity.data.find((c) => c.id === address.city);
      const cityName = city?.name || '';

      const listDistrict = await this.goshipService.getDistricts(address.city);
      const district = listDistrict.data.find((d) => d.id === address.district);
      const districtName = district?.name || '';

      let wardName = '';
      if (address.ward) {
        const listWard = await this.goshipService.getWards(district?.id);
        const ward = listWard?.data.find(
          (w) => w.id.toString() === address.ward,
        );
        wardName = ward?.name || '';
      }

      console.log(cityName, districtName, wardName, address.detail);
      throw new Error('Error');
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

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
}
