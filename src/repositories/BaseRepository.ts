import { Model, Document, Types, UpdateQuery } from 'mongoose';

export class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string): Promise<T | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).exec();
  }

  async create(data: Partial<Record<keyof T, unknown>>): Promise<T> {
    const doc = new this.model(data);
    return doc.save();
  }

  async updateById(id: string, data: UpdateQuery<T>): Promise<T | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }
}
