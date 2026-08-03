import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { generateWorkbook } from '../services/exportService.js';
import { getDatabase } from '../models/schema.js';
import { v4 as uuid } from 'uuid';
import path from 'path';

const router = Router();

router.use(authMiddleware);

router.post('/workbook', async (req, res) => {
  try {
    const { projectId, sheets } = req.body;
    if (!projectId) return res.status(400).json({ error: 'projectId required' });

    const workbook = await generateWorkbook(projectId, sheets || [{ key: 'core', label: 'Core', rows: 8 }]);
    const db = getDatabase();
    await db.run(
      `INSERT INTO exports (id, projectId, format, fileName, fileUrl, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid(), projectId, 'xlsx', workbook.fileName, workbook.url, 'completed']
    );

    res.download(workbook.filePath, workbook.fileName, (err) => {
      if (err) {
        console.error('Export download failed:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download workbook' });
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate export' });
  }
});

// serve exports static files
router.get('/files/:name', (req, res) => {
  const filePath = path.resolve(process.cwd(), 'server', 'exports', req.params.name);
  res.sendFile(filePath);
});

export default router;
