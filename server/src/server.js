import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import booksRouter from './routes/books.js';
import ordersRouter from './routes/orders.js';
import authRouter from './routes/auth.js';
import Book from './models/Book.js';
import seedBooks from './seedBooks.js';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api/books', booksRouter);
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

const port = process.env.PORT || 5000;
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log(`Connected to MongoDB (${mongoose.connection.name})`);
      const bookCount = await Book.countDocuments();
      if (bookCount === 0) {
        await Book.insertMany(seedBooks);
        console.log(`Added ${seedBooks.length} sample books to ${mongoose.connection.name}.books`);
      }
    })
    .catch(error => console.error('MongoDB connection failed:', error.message));
} else {
  console.warn('MONGODB_URI is not set. Add it to server/.env to enable database storage.');
}
app.listen(port, () => console.log(`Papertrail API listening on port ${port}`));
