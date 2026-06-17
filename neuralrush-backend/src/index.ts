import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.routes';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running in development mode on port ${PORT}`);
});