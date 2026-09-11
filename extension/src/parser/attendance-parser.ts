import { AttendanceSnapshot, SubjectAttendance } from '../../../shared/src/types.js';
import { calculatePercentage, aggregateAttendance } from '../../../shared/src/attendance-calculator.js';
import { ABES_ERP_SELECTORS, ERPSelectors } from './dom-selectors.js';

export type ParseResult =
  | { status: 'success'; data: AttendanceSnapshot }
  | { status: 'session_expired'; reason: string }
  | { status: 'not_attendance_page'; reason: string }
  | { status: 'error'; message: string };

interface ColumnIndices {
  code: number;
  name: number;
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

export class ABESAttendanceParser {
  private selectors: ERPSelectors;

  constructor(customSelectors?: Partial<ERPSelectors>) {
    this.selectors = { ...ABES_ERP_SELECTORS, ...customSelectors };
  }

  /**
   * Evaluates document state to check if ERP session has timed out or logged out
   */
  public checkSessionExpired(doc: Document = document, currentUrl: string = window.location.href): boolean {
    const lowerUrl = currentUrl.toLowerCase();
    for (const kw of this.selectors.sessionExpiredMarkers.urlKeywords) {
      if (lowerUrl.includes(kw)) {
        return true;
      }
    }

    for (const sel of this.selectors.sessionExpiredMarkers.domSelectors) {
      const el = doc.querySelector(sel);
      if (el) {
        // Visible or present login element
        const isInput = el.tagName === 'INPUT';
        if (isInput || (el as HTMLElement).offsetParent !== null || !doc.defaultView) {
          return true;
        }
      }
    }

    const bodyText = doc.body ? (doc.body.innerText || doc.body.textContent || '').toLowerCase() : '';
    for (const textKw of this.selectors.sessionExpiredMarkers.textKeywords) {
      if (bodyText.includes(textKw)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Parses the active attendance table from the DOM
   */
  public parseAttendance(doc: Document = document, currentUrl: string = window.location.href): ParseResult {
    // 1. Session Expiry Check
    if (this.checkSessionExpired(doc, currentUrl)) {
      return {
        status: 'session_expired',
        reason: 'ERP session expired or login screen detected. Please login normally to sync again.',
      };
    }

    // 2. Identify candidate tables
    const tables = this.findCandidateTables(doc);
    if (tables.length === 0) {
      return {
        status: 'not_attendance_page',
        reason: 'No attendance tables found on this page. Navigate to the Student Attendance section in ABES ERP.',
      };
    }

    // 3. Scan each table for attendance columns
    for (const table of tables) {
      const parsed = this.parseTable(table, doc);
      if (parsed) {
        return {
          status: 'success',
          data: parsed,
        };
      }
    }

    return {
      status: 'error',
      message: 'Could not identify subject attendance columns. ERP table format may have updated.',
    };
  }

  private findCandidateTables(doc: Document): HTMLTableElement[] {
    const results: HTMLTableElement[] = [];
    const seen = new Set<HTMLTableElement>();

    for (const selector of this.selectors.tableCandidates) {
      const elements = doc.querySelectorAll<HTMLTableElement>(selector);
      elements.forEach((tbl) => {
        if (!seen.has(tbl) && tbl.rows.length >= 2) {
          seen.add(tbl);
          results.push(tbl);
        }
      });
    }

    return results;
  }

  private parseTable(table: HTMLTableElement, doc: Document): AttendanceSnapshot | null {
    const rows = Array.from(table.rows);
    if (rows.length < 2) return null;

    // Detect header row (either <th> elements or first <tr> with matching texts)
    let headerRowIndex = -1;
    let colIndices: ColumnIndices | null = null;

    for (let r = 0; r < Math.min(rows.length, 4); r++) {
      const indices = this.matchHeaderColumns(rows[r]);
      if (indices) {
        headerRowIndex = r;
        colIndices = indices;
        break;
      }
    }

    if (!colIndices || headerRowIndex === -1) {
      return null;
    }

    const subjects: SubjectAttendance[] = [];
    let summaryOverall: { total: number; present: number; absent: number; pct: number } | null = null;

    // Parse data rows
    for (let r = headerRowIndex + 1; r < rows.length; r++) {
      const row = rows[r];
      const cells = Array.from(row.cells).map((c) =>
        (c.textContent || '').replace(/[\u00a0\u200B\s]+/g, ' ').trim()
      );
      if (cells.length < 3) continue;

      const fullRowText = cells.join(' ').toLowerCase();

      // Check if this is an overall / total summary row
      if (
        fullRowText.includes('total') ||
        fullRowText.includes('overall') ||
        fullRowText.includes('grand total') ||
        fullRowText.includes('aggregate')
      ) {
        const totalNum = this.cleanInt(cells[colIndices.total]);
        const presentNum = this.cleanInt(cells[colIndices.present]);
        const absentNum = colIndices.absent !== -1 ? this.cleanInt(cells[colIndices.absent]) : (totalNum - presentNum);
        const pctNum = colIndices.percentage !== -1 ? this.cleanFloat(cells[colIndices.percentage]) : calculatePercentage(presentNum, totalNum);

        if (totalNum > 0 && presentNum >= 0) {
          summaryOverall = {
            total: totalNum,
            present: presentNum,
            absent: absentNum >= 0 ? absentNum : Math.max(0, totalNum - presentNum),
            pct: pctNum,
          };
          continue;
        }
      }

      let code = colIndices.code !== -1 ? (cells[colIndices.code] || '') : '';
      let name = colIndices.name !== -1 ? (cells[colIndices.name] || '') : '';
      const total = this.cleanInt(cells[colIndices.total]);
      const present = this.cleanInt(cells[colIndices.present]);
      const absent = colIndices.absent !== -1 ? this.cleanInt(cells[colIndices.absent]) : Math.max(0, total - present);
      
      let percentage = colIndices.percentage !== -1 ? this.cleanFloat(cells[colIndices.percentage]) : 0;
      if (percentage <= 0 && total > 0) {
        percentage = calculatePercentage(present, total);
      }

      // If code is empty but name has combined format like "25CS301 - OOPS with C++"
      if (!code && name) {
        const splitMatch = name.match(/^([A-Za-z0-9]{5,10})[\s\-:]+(.+)$/);
        if (splitMatch) {
          code = splitMatch[1];
          name = splitMatch[2];
        }
      } else if (code && !name) {
        const splitMatch = code.match(/^([A-Za-z0-9]{5,10})[\s\-:]+(.+)$/);
        if (splitMatch) {
          code = splitMatch[1];
          name = splitMatch[2];
        }
      }

      // Valid subject criteria
      if ((code || name) && total > 0 && present >= 0 && present <= total) {
        subjects.push({
          subjectCode: code || `SUB-${subjects.length + 1}`,
          subjectName: name || code,
          totalLectures: total,
          present,
          absent: absent >= 0 ? absent : total - present,
          percentage,
        });
      }
    }

    if (subjects.length === 0) {
      return null;
    }

    // Determine overall
    const aggregated = aggregateAttendance(subjects);
    const overall = summaryOverall
      ? {
          totalLectures: summaryOverall.total,
          present: summaryOverall.present,
          absent: summaryOverall.absent,
          percentage: summaryOverall.pct,
        }
      : aggregated;

    // Semester and student info extraction
    const semester = this.extractSemester(doc);
    const studentInfo = this.extractStudentInfo(doc);

    const now = Date.now();
    const formattedDate = new Date(now).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      id: `snap-${now}`,
      timestamp: now,
      formattedDate,
      semester,
      studentName: studentInfo.name,
      studentRollNumber: studentInfo.rollNumber,
      subjects,
      overall,
      source: 'auto_sync',
    };
  }

  private matchHeaderColumns(row: HTMLTableRowElement): ColumnIndices | null {
    const cells = Array.from(row.cells).map((c) => (c.textContent || '').trim().toLowerCase());
    if (cells.length < 4) return null;

    let code = -1;
    let name = -1;
    let total = -1;
    let present = -1;
    let absent = -1;
    let percentage = -1;

    for (let i = 0; i < cells.length; i++) {
      const text = cells[i];
      if (this.selectors.columnMatchers.subjectCode.test(text)) code = i;
      else if (this.selectors.columnMatchers.subjectName.test(text)) name = i;
      else if (this.selectors.columnMatchers.totalLectures.test(text)) total = i;
      else if (this.selectors.columnMatchers.present.test(text)) present = i;
      else if (this.selectors.columnMatchers.absent.test(text)) absent = i;
      else if (this.selectors.columnMatchers.percentage.test(text)) percentage = i;
    }

    // Must at least identify Total and Present to be a valid attendance table
    if (total !== -1 && present !== -1) {
      // Heuristic fallback if code or name is missing
      if (code === -1 && name !== -1 && name > 0) code = 0;
      if (name === -1 && code !== -1 && code + 1 < cells.length) name = code + 1;
      return { code, name, total, present, absent, percentage };
    }

    return null;
  }

  private cleanInt(val: string | undefined): number {
    if (!val) return 0;
    const match = val.replace(/,/g, '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  private cleanFloat(val: string | undefined): number {
    if (!val) return 0;
    const match = val.replace(/,/g, '').replace(/%/g, '').match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  private extractSemester(doc: Document): string {
    for (const sel of this.selectors.semesterElement) {
      const el = doc.querySelector(sel);
      if (el && el.textContent) {
        const text = el.textContent.trim();
        if (/sem(ester)?/i.test(text)) {
          return text;
        }
      }
    }
    return 'Current Semester';
  }

  private extractStudentInfo(doc: Document): { name?: string; rollNumber?: string } {
    let name: string | undefined;
    let rollNumber: string | undefined;

    for (const sel of this.selectors.studentInfoElement) {
      const el = doc.querySelector(sel);
      if (el && el.textContent) {
        const text = el.textContent.trim();
        if (/\d{10,13}/.test(text) && !rollNumber) {
          rollNumber = text.match(/\d{10,13}/)?.[0];
        } else if (!name && text.length > 2 && text.length < 50) {
          name = text;
        }
      }
    }

    return { name, rollNumber };
  }
}
