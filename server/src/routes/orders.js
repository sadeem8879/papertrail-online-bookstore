import { Router } from 'express';
import mongoose from 'mongoose';
import Book from '../models/Book.js';
import Order from '../models/Order.js';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) { next(error); }
});

router.post('/', requireAuth, async (req, res, next) => {
  const requested = req.body?.items;
  if (!Array.isArray(requested) || requested.length === 0) {
    return res.status(400).json({ message: 'Your cart is empty.' });
  }

  const quantities = new Map();
  for (const item of requested) {
    const id = String(item.bookId || '');
    const quantity = Number(item.quantity);
    if (!mongoose.isValidObjectId(id) || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: 'The cart contains an invalid book or quantity. Refresh the page and try again.' });
    }
    quantities.set(id, (quantities.get(id) || 0) + quantity);
  }

  const reserved = [];
  try {
    const orderItems = [];
    let total = 0;

    for (const [id, quantity] of quantities) {
      const book = await Book.findOneAndUpdate(
        { _id: id, quantity: { $gte: quantity } },
        { $inc: { quantity: -quantity } },
        { new: true },
      );
      if (!book) {
        const existing = await Book.findById(id).select('title quantity');
        const title = existing?.title || 'A book in your cart';
        const available = existing?.quantity ?? 0;
        const error = new Error(`${title}: only ${available} ${available === 1 ? 'copy is' : 'copies are'} available. Your order was not placed.`);
        error.status = 409;
        throw error;
      }

      reserved.push({ id, quantity });
      total += book.price * quantity;
      orderItems.push({ book: book._id, title: book.title, author: book.author, quantity, unitPrice: book.price });
    }

    const order = await Order.create({ user: req.user.userId, items: orderItems, total, status: 'demo_ordered', paymentStatus: 'not_processed' });
    const updatedBooks = await Book.find({ _id: { $in: [...quantities.keys()] } });
    return res.status(201).json({
      message: 'Demo order recorded. No payment was processed.',
      order,
      updatedBooks,
    });
  } catch (error) {
    if (reserved.length) {
      await Promise.all(reserved.map(({ id, quantity }) => Book.updateOne({ _id: id }, { $inc: { quantity } })));
    }
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  }
});

export default router;
