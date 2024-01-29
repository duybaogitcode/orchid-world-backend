import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

@Injectable()
export class CrudService<T> {
  constructor(private readonly model: Model<T>) {}

  async findAll(): Promise<T[]> {
    return this.model.find().exec();
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.model(data);
    return entity.save() as T;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    await this.model.findByIdAndUpdate(id, data).exec();
    return this.model.findById(id).exec();
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }
}
