import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface GoShipResponse<T> {
  code: number;
  status: string;
  data: T;
}

export interface GoShipCity {
  id: string;
  name: string;
}

export interface GoShipDistrict extends GoShipCity {
  city_id: string;
}

export interface GoShipWard extends GoShipCity {
  district_id: string;
}

@Injectable()
export class GoShipService {
  private accessToken: string = '';
  private isLoggedIn: boolean = false;

  async getAxiosClient() {
    const accessToken = await this.getAccessToken();
    return axios.create({
      baseURL: 'https://sandbox.goship.io/api/v2',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async getAccessToken() {
    if (this.isLoggedIn) return this.accessToken;
    if (!this.accessToken || this.accessToken === '') {
      this.accessToken = await this.fetchAccessToken();
    }
    return this.accessToken;
  }

  private async fetchAccessToken() {
    // Fetch access token from GoShip
    const payload = {
      username: 'bao1322002@gmail.com',
      password: 'Duyb@o1302',
      client_id: 62,
      client_secret: 'ESVqcAKudePOSEO6j8tCKafD6aLdKaZF4tKqG6U2',
    };
    this.isLoggedIn = true;
    const response = await axios.post(
      'https://sandbox.goship.io/api/v2/login',
      payload,
    );
    return response.data.access_token;
  }

  async getCities(): Promise<GoShipResponse<GoShipCity[]>> {
    const client = await this.getAxiosClient();
    const response = await client.get('/cities');
    return response.data as GoShipResponse<GoShipCity[]>;
  }

  async getDistricts(
    cityId: string,
  ): Promise<GoShipResponse<GoShipDistrict[]>> {
    const client = await this.getAxiosClient();
    const response = await client.get(`/cities/${cityId}/districts`);
    return response.data as Promise<GoShipResponse<GoShipDistrict[]>>;
  }

  async getWards(districtId: string): Promise<GoShipResponse<GoShipWard[]>> {
    const client = await this.getAxiosClient();
    const response = await client.get(`/districts/${districtId}/wards`);
    return response.data as Promise<GoShipResponse<GoShipWard[]>>;
  }

  async getShippingFee({
    address_from,
    address_to,
    parcel,
  }: {
    address_from: { district: string; city: string };
    address_to: { district: string; city: string };
    parcel: {
      amount: number;
    };
  }): Promise<GoShipResponse<any>> {
    const client = await this.getAxiosClient();
    const response = await client.post('/rates', {
      shipment: {
        address_from,
        address_to,
        parcel: {
          ...parcel,
          width: 30,
          height: 60,
          length: 30,
          weight: 750,
        },
      },
    });
    return response.data as Promise<GoShipResponse<any>>;
  }
}
