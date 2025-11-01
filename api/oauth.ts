import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import { registerOAuthRoutes } from "../server/_core/oauth";

const app = express();

// Configure body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register OAuth routes
registerOAuthRoutes(app);

// Export as Vercel serverless function
export default async (req: Request, res: Response) => {
  return app(req, res);
};
