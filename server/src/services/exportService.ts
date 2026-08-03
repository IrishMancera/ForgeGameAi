import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

export async function generateWorkbook(projectId: string, sheets: { key: string; label: string; rows: number }[]) {
  const wb = new ExcelJS.Workbook();
  sheets.forEach((s) => {
    const ws = wb.addWorksheet(s.label);
    // add header row as example
    ws.addRow(['Column A', 'Column B', 'Column C']);
    for (let i = 0; i < Math.max(1, s.rows); i++) {
      ws.addRow([`R${i + 1}A`, `R${i + 1}B`, `R${i + 1}C`]);
    }
  });

  const id = uuid();
  const fileName = `project-${projectId}-export-${id}.xlsx`;
  const outDir = path.resolve(process.cwd(), 'server', 'exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, fileName);

  await wb.xlsx.writeFile(filePath);

  return { id, fileName, filePath, url: `/exports/${fileName}` };
}
