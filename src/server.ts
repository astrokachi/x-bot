import "dotenv/config";
import express from 'express';
import routes from './routes/reply-tweet.route';
import { logger } from './utils/logger';
import { requestLogger } from './middleware/request-logger';

const PORT = process.env.PORT || 8080
const app = express();
app.use(express.json());

if (!process.env.GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN is not set. Set it in your environment or .env file.");
}

if (!process.env.OAUTH_CLIENT_ID || !process.env.OAUTH_CLIENT_SECRET) {
  console.error("OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET are not set. Set them in your environment or .env file.");
}

app.use(requestLogger);

app.use("/api", routes)

app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
})