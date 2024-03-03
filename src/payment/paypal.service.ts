import { Injectable } from '@nestjs/common';
const paypal = require('@paypal/checkout-server-sdk');
const paypalout = require('@paypal/payouts-sdk');
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaypalService {
  private client: any;
  private clientout: any;
  constructor() {
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

  async getCapture(captureId: string) {
    // console.log(paypal);

    const request = new paypal.orders.OrdersGetRequest(captureId);
    try {
      const response = await this.client.execute(request);
      console.log(
        response.result.status,
        // response.result.purchase_units[0].amount.value,
        // response.result.purchase_units[0].description,
      );

      if (response.result.status !== 'COMPLETED') {
        throw new Error('Payment not completed');
      }

      console.log('Payment completed');
      return true;
    } catch (err) {
      throw new Error('Payment not completed');
    }
  }

  async createPayout(
    bactchId: string,
    amount: string,
    receiver: string,
    uid: string,
  ) {
    try {
      const request = new paypalout.payouts.PayoutsPostRequest();
      request.requestBody({
        sender_batch_header: {
          recipient_type: 'EMAIL',
          email_message: uid + ' rút tiền',
          note: 'Enjoy your Payout!!',
          sender_batch_id: bactchId,
          email_subject: 'Rút tiền từ ví của Orchid',
        },
        items: [
          {
            note: 'Tiền rút từ ví Orchid Wallet',
            amount: {
              currency: 'USD',
              value: amount,
            },
            receiver: receiver,
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
