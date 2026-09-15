// Paste this into the Apps Script editor (script.google.com) bound to your Google Sheet.
// Before deploying, set the two script properties below via
// Project Settings > Script Properties: SHEET_ID and DRIVE_FOLDER_ID.

const SHEET_NAME = 'Entries'

const COLUMNS = [
  'id', 'date', 'pair', 'timeframe', 'strategy',
  'entryPrice', 'exitPrice', 'stopLoss', 'takeProfit',
  'indicators', 'entryTrigger', 'outcome', 'pnl', 'rMultiple',
  'notes', 'chartImageUrl', 'createdAt',
]

function getSheet_() {
  const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID')
  const ss = SpreadsheetApp.openById(sheetId)
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
    sheet.appendRow(COLUMNS)
  }
  return sheet
}

function getFolder_() {
  const folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID')
  return DriveApp.getFolderById(folderId)
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

function rowToEntry_(row) {
  const entry = {}
  COLUMNS.forEach((col, i) => (entry[col] = row[i]))
  return entry
}

function entryToRow_(entry) {
  return COLUMNS.map((col) => entry[col] ?? '')
}

function saveImage_(base64, entryId) {
  const folder = getFolder_()
  const bytes = Utilities.base64Decode(base64)
  const blob = Utilities.newBlob(bytes, 'image/png', `chart-${entryId}.png`)
  const file = folder.createFile(blob)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
  return `https://drive.google.com/uc?id=${file.getId()}`
}

function doGet(e) {
  const action = e.parameter.action
  if (action === 'list') {
    const sheet = getSheet_()
    const values = sheet.getDataRange().getValues()
    const entries = values.slice(1).map(rowToEntry_)
    return jsonResponse_({ ok: true, entries })
  }
  return jsonResponse_({ ok: false, error: 'Unknown action' })
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents)
    const sheet = getSheet_()

    if (body.action === 'create') {
      const id = Utilities.getUuid()
      const entry = { ...body.entry, id, createdAt: new Date().toISOString() }
      if (body.imageBase64) {
        entry.chartImageUrl = saveImage_(body.imageBase64, id)
      }
      sheet.appendRow(entryToRow_(entry))
      return jsonResponse_({ ok: true, entry })
    }

    if (body.action === 'update') {
      const idCol = COLUMNS.indexOf('id') + 1
      const data = sheet.getDataRange().getValues()
      const rowIndex = data.findIndex((row, i) => i > 0 && row[idCol - 1] === body.id)
      if (rowIndex === -1) return jsonResponse_({ ok: false, error: 'Entry not found' })

      const existing = rowToEntry_(data[rowIndex])
      const entry = { ...existing, ...body.entry, id: body.id }
      if (body.imageBase64) {
        entry.chartImageUrl = saveImage_(body.imageBase64, body.id)
      }
      sheet.getRange(rowIndex + 1, 1, 1, COLUMNS.length).setValues([entryToRow_(entry)])
      return jsonResponse_({ ok: true, entry })
    }

    if (body.action === 'delete') {
      const idCol = COLUMNS.indexOf('id') + 1
      const data = sheet.getDataRange().getValues()
      const rowIndex = data.findIndex((row, i) => i > 0 && row[idCol - 1] === body.id)
      if (rowIndex === -1) return jsonResponse_({ ok: false, error: 'Entry not found' })
      sheet.deleteRow(rowIndex + 1)
      return jsonResponse_({ ok: true })
    }

    return jsonResponse_({ ok: false, error: 'Unknown action' })
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message })
  }
}
