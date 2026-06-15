import express, { Request, Response } from 'express';
import authRoutes from './routes/auth.routes'; // <-- Import the new router

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes); // <-- All auth routes now start with /api/auth

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in development mode on port ${PORT}`);
});