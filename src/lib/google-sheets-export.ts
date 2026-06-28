import { google } from "googleapis";
import { expensesToSheetRows } from "@/lib/expense-spreadsheet";
import type { ExpenseDateSort } from "@/lib/expense-grouping";
import { sortExpensesByDate } from "@/lib/expense-grouping";
import type { Expense } from "@/lib/types";

export function isGoogleSheetsExportConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim());
}

function getServiceAccountCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error(
      "Google Sheets export is not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON.",
    );
  }

  const credentials = JSON.parse(raw) as {
    client_email?: string;
    private_key?: string;
  };

  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key.");
  }

  return credentials;
}

export async function exportExpensesToGoogleSheet(
  expenses: Expense[],
  sort: ExpenseDateSort,
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const sorted = sortExpensesByDate(expenses, sort);
  const auth = new google.auth.GoogleAuth({
    credentials: getServiceAccountCredentials(),
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const drive = google.drive({ version: "v3", auth });
  const title = `Moodna Expenses ${new Date().toISOString().slice(0, 10)}`;

  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
    },
  });

  const spreadsheetId = created.data.spreadsheetId;
  if (!spreadsheetId) {
    throw new Error("Google Sheets did not return a spreadsheet ID.");
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Sheet1!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: expensesToSheetRows(sorted),
    },
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId: created.data.sheets?.[0]?.properties?.sheetId ?? 0,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
              },
            },
            fields: "userEnteredFormat.textFormat.bold",
          },
        },
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId: created.data.sheets?.[0]?.properties?.sheetId ?? 0,
              dimension: "COLUMNS",
              startIndex: 0,
              endIndex: 12,
            },
          },
        },
      ],
    },
  });

  const shareEmail = process.env.GOOGLE_SHEETS_SHARE_EMAIL?.trim();
  if (shareEmail) {
    await drive.permissions.create({
      fileId: spreadsheetId,
      sendNotificationEmail: false,
      requestBody: {
        type: "user",
        role: "writer",
        emailAddress: shareEmail,
      },
    });
  } else {
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        type: "anyone",
        role: "writer",
      },
    });
  }

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}
