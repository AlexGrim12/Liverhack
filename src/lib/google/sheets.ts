import { GOOGLE } from "./config";
import { gfetch } from "./http";

// Crea una hoja de cálculo nueva (en el Drive de quien exporta) con las filas dadas. Scope drive.file.
export async function createSheet(token: string, title: string, rows: (string | number)[][]): Promise<{ id: string; url: string }> {
  const cell = (v: string | number) => (typeof v === "number" ? { userEnteredValue: { numberValue: v } } : { userEnteredValue: { stringValue: v } });
  const r = await gfetch<{ spreadsheetId: string; spreadsheetUrl: string }>(`${GOOGLE.sheetsBase}/spreadsheets`, token, {
    method: "POST",
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: { title: "Comparativa", gridProperties: { frozenRowCount: 1 } },
          data: [{ startRow: 0, startColumn: 0, rowData: rows.map((row, i) => ({ values: row.map((v) => ({ ...cell(v), ...(i === 0 ? { userEnteredFormat: { textFormat: { bold: true } } } : {}) })) })) }],
        },
      ],
    }),
  });
  return { id: r.spreadsheetId, url: r.spreadsheetUrl };
}
