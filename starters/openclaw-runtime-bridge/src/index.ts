import { startServer } from './server';

// Handle uncaught exceptions gracefully without bringing down the bridge entirely where possible
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

startServer();
