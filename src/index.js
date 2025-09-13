import { app } from './app.js'
import connectDB from './db/index.js'

import dotenv from 'dotenv'
dotenv.config({
    path:"./.env"
})

const PORT = process.env.PORT || 3000; // fallback to 3000 locally

connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection error", err);
  });
