import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
    const app = express();
    const port = 3000;

    app.use(express.json());

    // API Routes - Proxy to Supabase
    app.get('/api/gallery', async (req, res) => {
        try {
            const supabaseUrl = process.env.SUPABASE_URL || 'https://byspouzbijpkvclztxru.supabase.co';
            const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5c3BvdXpiaWpwa3ZjbHp0eHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzg3NzcsImV4cCI6MjA4NzY1NDc3N30.Wkhmc-tYxiWFao6lShkMYNIAIgvos1pDXDkEXsVXDXk';

            const response = await fetch(`${supabaseUrl}/rest/v1/gallery?select=*`, {
                method: 'GET',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Supabase error:', errorText);
                return res.status(response.status).json({ error: 'Supabase fetch failed' });
            }

            const data = await response.json();
            res.json(data);
        } catch (error) {
            console.error('Server error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(port, '0.0.0.0', () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

startServer();
