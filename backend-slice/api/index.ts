// Vercel serverless entry point — wraps the Express app
// Vercel's @vercel/node runtime detects an Express app exported as default
// and handles the IncomingMessage/ServerResponse bridge automatically.
import { buildApp } from '../src/index.js';

export default buildApp();
