/**
 * ABES ERP DOM Selectors Configuration
 * 
 * All DOM selectors, table identifiers, and regex patterns are strictly
 * isolated in this file so they can be adapted easily if the ERP changes
 * its layout, classes, or table IDs.
 */

export interface ERPSelectors {
  /** Possible CSS selectors to find attendance table elements */
  tableCandidates: string[];
  /** Selectors or attributes to find the semester title/header */
  semesterElement: string[];
  /** Selectors to find student name or roll number */
  studentInfoElement: string[];
  /** Indicators that signify session expiration or login page */
  sessionExpiredMarkers: {
    urlKeywords: string[];
    domSelectors: string[];
    textKeywords: string[];
  };
  /** Column header pattern matchers (case-insensitive regex) */
  columnMatchers: {
    subjectCode: RegExp;
    subjectName: RegExp;
    totalLectures: RegExp;
    present: RegExp;
    absent: RegExp;
    percentage: RegExp;
  };
}

export const ABES_ERP_SELECTORS: ERPSelectors = {
  tableCandidates: [
    // Direct ID patterns used in ASP.NET / ERP
    'table[id*="attendance" i]',
    'table[id*="Attendance" i]',
    'table[id*="gv" i]',
    'table[id*="grid" i]',
    'table#tblAttendance',
    'table#gvAttendance',
    'table#gridAttendance',
    // Class-based patterns
    'table.attendance-table',
    'table.table-bordered',
    'table.table-striped',
    'table.table',
    'table[border]',
    'table',
  ],

  semesterElement: [
    '#lblSemester',
    '#ddlSemester option:selected',
    '#ddlSemester',
    '.semester-title',
    '.page-title',
    'h1',
    'h2',
    'h3',
    'h4',
    '.card-title',
  ],

  studentInfoElement: [
    '#lblStudentName',
    '#lblRollNo',
    '#lblEnrollmentNo',
    '.user-profile',
    '.student-name',
    '.profile-name',
    '.student-info',
    '.user-info',
  ],

  sessionExpiredMarkers: {
    urlKeywords: [
      'login',
      'default.aspx',
      'auth',
      'sessionexpired',
      'timeout',
      'logout',
    ],
    domSelectors: [
      'input[type="password"]',
      '#txtPassword',
      '#txtUserName',
      '#txtLogin',
      '#btnSubmit',
      '#btnLogin',
      '#txtOTP',
      '.login-form',
      'form[action*="login" i]',
    ],
    textKeywords: [
      'session expired',
      'session timed out',
      'please login again',
      'login to continue',
      'enter user name',
      'enter password',
      'sign in to continue',
    ],
  },

  columnMatchers: {
    subjectCode: /subject\s*code|sub\s*code|paper\s*code|course\s*code|^code$|^subcode$/i,
    subjectName: /subject\s*name|course\s*name|paper\s*name|subject|^course$/i,
    totalLectures: /total\s*lecture|total\s*classes|total\s*held|total\s*lect|conducted|held|^total$/i,
    present: /^present|^attended|^pres|classes\s*attended|total\s*present/i,
    absent: /^absent|^abs|classes\s*missed|total\s*absent/i,
    percentage: /%\s*attendance|\(%\)|percentage|att\s*%|^%$|^att\s*perc/i,
  },
};
