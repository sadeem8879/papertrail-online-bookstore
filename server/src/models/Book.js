import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  description: { type: String, trim: true, default: '' },
  cover: { type: String, trim: true, default: '' },
}, { timestamps: true });

export default mongoose.model('Book', bookSchema);
