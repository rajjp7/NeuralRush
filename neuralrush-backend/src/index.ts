import express  from 'express';

import {config} from './config/env';

const app = express();

app.use(express.json());

app.get('/api/health', (req,res ) => {
  res.status(200).json({
    status: 'healthy',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

app.listen(config.port, () => {
  console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${config.port}`);
});