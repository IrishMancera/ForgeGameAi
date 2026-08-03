export interface ExportSheet {
  key: string;
  label: string;
  rows: number;
}

export async function downloadWorkbook(projectId: string, sheets: ExportSheet[] = [{ key: 'core', label: 'Core', rows: 8 }]) {
  const token = localStorage.getItem('gameforge_token') || '';
  const response = await fetch(`/api/exports/workbook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ projectId, sheets }),
  });

  if (!response.ok) {
    const text = await response.text();
    let errorMessage = 'Export failed';
    try {
      const payload = JSON.parse(text);
      errorMessage = payload.error || payload.message || errorMessage;
    } catch {
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
  const fileName = filenameMatch?.[1] || `project-${projectId}-export.xlsx`;

  return { blob, fileName };
}
