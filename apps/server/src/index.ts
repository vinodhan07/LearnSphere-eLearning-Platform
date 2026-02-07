import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - Allow all localhost origins for development
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow all localhost origins for development
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: `Path not found: ${req.originalUrl}` });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API available at http://localhost:${PORT}/api`);
});

export default app;
// db migration complete