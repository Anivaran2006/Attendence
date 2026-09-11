import assert from 'assert';
import { JSDOM } from 'jsdom';

// Import parser source
import { ABESAttendanceParser } from '../extension/src/parser/attendance-parser.ts';
import { ABES_ERP_SELECTORS } from '../extension/src/parser/dom-selectors.ts';

console.log('--- Testing ABES Attendance Parser ---');

// Test Case 1: Session Expiration Detection
{
  const parser = new ABESAttendanceParser();

  // 1a: URL containing login
  const dom1 = new JSDOM(`<!DOCTYPE html><html><body><h1>Welcome</h1></body></html>`);
  assert.strictEqual(
    parser.checkSessionExpired(dom1.window.document, 'https://erp.abes.ac.in/Login.aspx'),
    true,
    'Should detect session expired from login URL'
  );

  // 1b: Password input on page
  const dom2 = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <form>
          <input type="text" id="txtUserName" value="student" />
          <input type="password" id="txtPassword" />
        </form>
      </body>
    </html>
  `);
  assert.strictEqual(
    parser.checkSessionExpired(dom2.window.document, 'https://erp.abes.ac.in/student/'),
    true,
    'Should detect password input indicating login/expired session'
  );

  // 1c: Text keyword on page
  const dom3 = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div class="alert">Your session timed out. Please login again to continue.</div>
      </body>
    </html>
  `);
  assert.strictEqual(
    parser.checkSessionExpired(dom3.window.document, 'https://erp.abes.ac.in/attendance'),
    true,
    'Should detect session expired text banner'
  );

  console.log('✓ Session expiry detection tests PASSED');
}

// Test Case 2: Standard ABES ERP Attendance Table Parsing
{
  const parser = new ABESAttendanceParser();

  const tableHtml = `
    <!DOCTYPE html>
    <html>
      <body>
        <h3 class="page-title">Semester III (2026-27)</h3>
        <span class="profile-name">2400320100099 - ABES Student</span>

        <table id="tblAttendance" class="table table-bordered">
          <thead>
            <tr>
              <th>Subject Code</th>
              <th>Subject Name</th>
              <th>Total Lecture</th>
              <th>Present</th>
              <th>Absent</th>
              <th>(%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>25AS301</td>
              <td>Applied Maths for Computing Applications</td>
              <td>28</td>
              <td>24</td>
              <td>4</td>
              <td>85.71</td>
            </tr>
            <tr>
              <td>25CS301</td>
              <td>OOPS with C++</td>
              <td>18</td>
              <td>17</td>
              <td>1</td>
              <td>94.44</td>
            </tr>
            <tr>
              <td>25CS302</td>
              <td>Operating System</td>
              <td>20</td>
              <td>16</td>
              <td>4</td>
              <td>80</td>
            </tr>
            <tr>
              <td>25CS303</td>
              <td>Advanced Data Structures using C++</td>
              <td>30</td>
              <td>26</td>
              <td>4</td>
              <td>86.67</td>
            </tr>
            <tr>
              <td>25CS351</td>
              <td>OOPS with C++ Lab</td>
              <td>10</td>
              <td>10</td>
              <td>0</td>
              <td>100</td>
            </tr>
            <tr>
              <td>25CS352</td>
              <td>Operating System Lab</td>
              <td>12</td>
              <td>12</td>
              <td>0</td>
              <td>100</td>
            </tr>
            <tr>
              <td>25CS353</td>
              <td>Advanced Data Structures using C++ Lab</td>
              <td>12</td>
              <td>10</td>
              <td>2</td>
              <td>83.33</td>
            </tr>
            <tr>
              <td>25HU301</td>
              <td>Universal Human Values</td>
              <td>14</td>
              <td>14</td>
              <td>0</td>
              <td>100</td>
            </tr>
            <tr>
              <td>25VA301</td>
              <td>Data Visualization using Python</td>
              <td>16</td>
              <td>14</td>
              <td>2</td>
              <td>87.5</td>
            </tr>
            <tr>
              <td>25VA309</td>
              <td>Employability Skills</td>
              <td>17</td>
              <td>15</td>
              <td>2</td>
              <td>88.24</td>
            </tr>
            <tr>
              <td>25VA351</td>
              <td>Web Designing Workshop-III</td>
              <td>16</td>
              <td>12</td>
              <td>4</td>
              <td>75</td>
            </tr>
            <tr>
              <td>25VA352</td>
              <td>Holistic Skill & Innovation III</td>
              <td>7</td>
              <td>6</td>
              <td>1</td>
              <td>85.71</td>
            </tr>
            <tr class="total-row">
              <td>Total</td>
              <td>Overall Attendance</td>
              <td>200</td>
              <td>176</td>
              <td>24</td>
              <td>88%</td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `;

  const dom = new JSDOM(tableHtml);
  const result = parser.parseAttendance(dom.window.document, 'https://erp.abes.ac.in/student/attendance.aspx');

  assert.strictEqual(result.status, 'success', 'Parser should successfully parse the table');
  if (result.status === 'success') {
    const data = result.data;
    assert.strictEqual(data.subjects.length, 12, 'Must parse exactly 12 subjects');
    assert.strictEqual(data.overall.totalLectures, 200, 'Total lectures must be 200');
    assert.strictEqual(data.overall.present, 176, 'Present must be 176');
    assert.strictEqual(data.overall.absent, 24, 'Absent must be 24');
    assert.strictEqual(data.overall.percentage, 88.0, 'Overall percentage must be 88%');
    assert.strictEqual(data.subjects[0].subjectCode, '25AS301');
    assert.strictEqual(data.subjects[0].percentage, 85.71);
    console.log('✓ Standard ABES ERP table parsing PASSED');
  }
}

// Test Case 3: Permuted column order resilience
{
  const parser = new ABESAttendanceParser();

  const permutedHtml = `
    <!DOCTYPE html>
    <html>
      <body>
        <table>
          <thead>
            <tr>
              <th>Subject Name</th>
              <th>Present</th>
              <th>Total Classes</th>
              <th>Absent</th>
              <th>Sub Code</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Database Management</td>
              <td>18</td>
              <td>20</td>
              <td>2</td>
              <td>CS401</td>
              <td>90.0%</td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `;

  const dom = new JSDOM(permutedHtml);
  const result = parser.parseAttendance(dom.window.document, 'https://erp.abes.ac.in/portal/attendance');
  assert.strictEqual(result.status, 'success');
  if (result.status === 'success') {
    assert.strictEqual(result.data.subjects[0].subjectCode, 'CS401');
    assert.strictEqual(result.data.subjects[0].present, 18);
    assert.strictEqual(result.data.subjects[0].totalLectures, 20);
    assert.strictEqual(result.data.subjects[0].percentage, 90.0);
    console.log('✓ Permuted column order dynamic mapping PASSED');
  }
}

// Test Case 4: Non-attendance page
{
  const parser = new ABESAttendanceParser();
  const nonAttendanceHtml = `<!DOCTYPE html><html><body><h1>Notice Board</h1><p>No tables here</p></body></html>`;
  const dom = new JSDOM(nonAttendanceHtml);
  const result = parser.parseAttendance(dom.window.document, 'https://erp.abes.ac.in/notices');
  assert.strictEqual(result.status, 'not_attendance_page');
  console.log('✓ Non-attendance page detection PASSED');
}

console.log('✓ All ABES Attendance Parser tests PASSED successfully!');
