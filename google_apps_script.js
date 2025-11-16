/**
 * FEES MANAGEMENT SYSTEM - GOOGLE APPS SCRIPT BACKEND
 * Copy this code into Extensions > Apps Script in your Google Sheet.
 */

// Sheet Names
const SHEET_STUDENTS = 'Students';
const SHEET_PAYMENTS = 'Payments';
const SHEET_FEES = 'FeesConfig';

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create Students Sheet
  if (!ss.getSheetByName(SHEET_STUDENTS)) {
    const s = ss.insertSheet(SHEET_STUDENTS);
    s.appendRow(['JSON_DATA']); // We store full JSON object in one cell for simplicity in NoSQL style, or cols
    // For this hybrid approach, we'll use standard columns for easy viewing
    s.clear();
    s.appendRow(['id', 'name', 'fatherName', 'motherName', 'dob', 'class', 'previousPending', 'currentYearFee', 'paidAmount']);
  }
  
  // Create Payments Sheet
  if (!ss.getSheetByName(SHEET_PAYMENTS)) {
    const s = ss.insertSheet(SHEET_PAYMENTS);
    s.appendRow(['id', 'studentId', 'date', 'amount', 'mode', 'allocations_json', 'receiptNo', 'recordedBy_json']);
  }
  
  // Create Fees Sheet
  if (!ss.getSheetByName(SHEET_FEES)) {
    const s = ss.insertSheet(SHEET_FEES);
    s.appendRow(['className', 'annualFee']);
    // Init Defaults
    ['LKG','UKG','1','2','3','4','5','6','7','8','9','10'].forEach(c => {
      s.appendRow([c, 20000]);
    });
  }
}

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let result = [];
  
  if (action === 'getStudents') {
    const sheet = ss.getSheetByName(SHEET_STUDENTS);
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    result = data.map(row => ({
      id: row[0],
      name: row[1],
      fatherName: row[2],
      motherName: row[3],
      dob: row[4],
      class: row[5],
      previousPending: JSON.parse(row[6] || '[]'),
      currentYearFee: Number(row[7]),
      paidAmount: Number(row[8])
    }));
  } 
  else if (action === 'getFees') {
    const sheet = ss.getSheetByName(SHEET_FEES);
    const data = sheet.getDataRange().getValues();
    data.shift();
    result = data.map(row => ({
      className: row[0],
      annualFee: Number(row[1]),
      components: [] // simplified for sheet storage
    }));
  }
  else if (action === 'getPayments') {
    const sheet = ss.getSheetByName(SHEET_PAYMENTS);
    const data = sheet.getDataRange().getValues();
    data.shift();
    result = data.map(row => ({
      id: row[0],
      studentId: row[1],
      date: row[2],
      amount: Number(row[3]),
      mode: row[4],
      allocations: JSON.parse(row[5] || '[]'),
      receiptNo: row[6],
      recordedBy: JSON.parse(row[7] || '{}')
    }));
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const req = JSON.parse(e.postData.contents);
  const action = req.action;
  const data = req.data;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'addStudent') {
    const sheet = ss.getSheetByName(SHEET_STUDENTS);
    sheet.appendRow([
      data.id, data.name, data.fatherName, data.motherName, data.dob, data.class, 
      JSON.stringify(data.previousPending), data.currentYearFee, data.paidAmount
    ]);
  }
  
  else if (action === 'updateStudent') {
    const sheet = ss.getSheetByName(SHEET_STUDENTS);
    const range = sheet.getDataRange();
    const values = range.getValues();
    // Find row by ID (col 0)
    for(let i=1; i<values.length; i++) {
      if(values[i][0] === data.id) {
        // Update specific columns
        const rowNum = i + 1;
        sheet.getRange(rowNum, 1, 1, 9).setValues([[
           data.id, data.name, data.fatherName, data.motherName, data.dob, data.class, 
           JSON.stringify(data.previousPending), data.currentYearFee, data.paidAmount
        ]]);
        break;
      }
    }
  }

  else if (action === 'deleteStudent') {
      const sheet = ss.getSheetByName(SHEET_STUDENTS);
      const values = sheet.getDataRange().getValues();
      for(let i=1; i<values.length; i++) {
          if(values[i][0] === data.id) {
              sheet.deleteRow(i+1);
              break;
          }
      }
  }
  
  else if (action === 'recordPayment') {
    // 1. Add Payment
    const pSheet = ss.getSheetByName(SHEET_PAYMENTS);
    const p = data.payment;
    pSheet.appendRow([
      p.id, p.studentId, p.date, p.amount, p.mode, 
      JSON.stringify(p.allocations), p.receiptNo, JSON.stringify(p.recordedBy)
    ]);
    
    // 2. Update Student Balance
    const sSheet = ss.getSheetByName(SHEET_STUDENTS);
    const s = data.student;
    const values = sSheet.getDataRange().getValues();
    for(let i=1; i<values.length; i++) {
      if(values[i][0] === s.id) {
        const rowNum = i + 1;
        // Update Pending (col 7 / index 6) and Paid (col 9 / index 8)
        sSheet.getRange(rowNum, 7).setValue(JSON.stringify(s.previousPending));
        sSheet.getRange(rowNum, 9).setValue(s.paidAmount);
        break;
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
    .setMimeType(ContentService.MimeType.JSON);
}