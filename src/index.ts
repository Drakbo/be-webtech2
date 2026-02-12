import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import studentsRoute from './students/students.route.js';

const app = new Hono();

// Enable CORS for frontend communication
app.use('/*', cors({
  origin: 'http://localhost:4200',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

app.get('/', (c) => {
  return c.text('Hello Hono! Student API is running.');
});

app.route('/students', studentsRoute);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});