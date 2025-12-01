import "dotenv/config";
import express from 'express';
import routes from './routes/reply-tweet.route';
import authRoute from './routes/auth.route'
import { requestLogger } from './middleware/request-logger';
import session from "express-session";

const PORT = process.env.PORT || 8080
const app = express();
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
    },
  })
);


if (!process.env.GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN is not set.");
}

if (!process.env.X_CLIENT_ID) {
  console.error("X_CLIENT_ID not set.");
}

app.use(requestLogger);

app.use("/api", routes)
app.use("/auth", authRoute)

app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
})