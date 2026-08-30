const SHEET_NAME = 'Лист1';

function getSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
    || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}

function doGet() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const comments = {};
  values.slice(1).forEach(row => {
    const [key, title, owner, text, updatedAt] = row;
    if (key) comments[key] = { key, title, owner, text: text || '', updatedAt: updatedAt || null };
  });
  return json_({ comments });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const comment = body.comment || {};
    if (!comment.key) throw new Error('Не указан ключ комментария');

    const sheet = getSheet_();
    const values = sheet.getDataRange().getValues();
    const rowIndex = values.findIndex(row => row[0] === comment.key);
    const row = [comment.key, comment.title || '', comment.owner || '', comment.text || '', comment.updatedAt || new Date().toISOString()];

    if (rowIndex === -1) sheet.appendRow(row);
    else sheet.getRange(rowIndex + 1, 1, 1, row.length).setValues([row]);

    return json_({ ok: true, comment: row });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}