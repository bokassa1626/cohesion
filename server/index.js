import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { Server } from 'socket.io';
import { config } from './config.js';
import { readDb } from './data/store.js';
import { apiLimiter } from './middleware/security.js';
import { authRouter } from './routes/auth.js';
import { appRouter } from './routes/app.js';
import { openApiSpec } from './openapi.js';
import { attachRealtime } from './services/realtime.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || config.clientOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origine CORS non autorisée: ${origin}`));
  },
  credentials: true,
};
const io = new Server(server, {
  cors: { origin: config.clientOrigins, credentials: true },
});

attachRealtime(io);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use('/api', apiLimiter);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use('/api/auth', authRouter);
app.use('/api', appRouter);

const distDir = path.resolve(__dirname, '../dist');
app.use(express.static(distDir));
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error(err);
  return res.status(500).json({ message: 'Erreur serveur.', detail: config.env === 'production' ? undefined : err.message });
});

readDb().catch((error) => {
  console.error('Initialisation de la base JSON impossible:', error);
});

server.listen(config.port, () => {
  console.log(`Cohésion fraternelle API: http://127.0.0.1:${config.port}`);
  console.log(`Swagger: http://127.0.0.1:${config.port}/api/docs`);
});

export { app, server, io };
