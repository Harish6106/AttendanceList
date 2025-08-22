const apiBase = "http://localhost:5000";

// -------- NAVIGATION --------
const dashboardBtn = document.getElementById("dashboardBtn");
const studentsBtn = document.getElementById("studentsBtn");

dashboardBtn.addEventListener("click", () => {
  loadDashboard();
  showPage("dashboardPage");
});

studentsBtn.addEventListener("click", () => {
  loadStudents();
  showPage("studentsPage");
});

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
}

// -------- DASHBOARD --------
async function loadDashboard() {
  try {
    const [studentsRes, attendanceRes] = await Promise.all([
      fetch(`${apiBase}/students`),
      fetch(`${apiBase}/attendance`)
    ]);

    const students = await studentsRes.json();
    const records = await attendanceRes.json();

    let present = 0, absent = 0;
    records.forEach(r => {
      if (r.status.toLowerCase() === "present") present++;
      else if (r.status.toLowerCase() === "absent") absent++;
    });

    const totalStudents = students.length;
    const notMarked = totalStudents - records.length;

    document.getElementById("total").innerText = totalStudents;
    document.getElementById("present").innerText = present;
    document.getElementById("absent").innerText = absent;
    document.getElementById("notMarked").innerText = notMarked;
  } catch (err) {
    console.error(err);
  }
}

// -------- STUDENTS --------
async function loadStudents() {
  try {
    const res = await fetch(`${apiBase}/students`);
    const students = await res.json();
    renderStudents(students);
  } catch (err) {
    console.error(err);
  }
}

function renderStudents(students) {
  const tbody = document.getElementById("studentTableBody");
  tbody.innerHTML = "";

  students.forEach(student => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td class="student-link" data-id="${student._id}">${student.name}</td>
      <td>
        <button class="present-btn">✅ Present</button>
        <button class="absent-btn">❌ Absent</button>
      </td>
      <td>
        <button class="delete-btn">🗑️ Delete</button>
      </td>
    `;

    tbody.appendChild(row);

    row.querySelector(".present-btn").addEventListener("click", () => markAttendance(student._id, "Present"));
    row.querySelector(".absent-btn").addEventListener("click", () => markAttendance(student._id, "Absent"));
    row.querySelector(".delete-btn").addEventListener("click", () => deleteStudent(student._id));
    row.querySelector(".student-link").addEventListener("click", () => showStudentAttendance(student._id, student.name));
  });
}

// -------- ADD STUDENT --------
document.getElementById("studentForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("studentName").value.trim();
  if (!name) return;

  await fetch(`${apiBase}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });

  document.getElementById("studentName").value = "";
  loadStudents();
  loadDashboard();
});

// -------- DELETE STUDENT --------
async function deleteStudent(id) {
  await fetch(`${apiBase}/students/${id}`, { method: "DELETE" });
  loadStudents();
  loadDashboard();
}

// -------- MARK ATTENDANCE --------
async function markAttendance(studentId, status) {
  await fetch(`${apiBase}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, status, date: new Date() })
  });

  loadDashboard();
}

// -------- VIEW STUDENT ATTENDANCE --------
async function showStudentAttendance(studentId, name) {
  try {
    const res = await fetch(`${apiBase}/attendance/${studentId}`);
    const data = await res.json();

    let historyHTML = `
      <h2>📜 Attendance for ${name}</h2>
      <table>
        <thead>
          <tr><th>Date</th><th>Status</th></tr>
        </thead>
        <tbody>
    `;

    if (data.length === 0) {
      historyHTML += `<tr><td colspan="2">No attendance records found for ${name}.</td></tr>`;
    } else {
      data.forEach(r => {
        historyHTML += `
          <tr>
            <td>${new Date(r.date).toLocaleDateString()}</td>
            <td>${r.status === "Present" ? "✅ Present" : "❌ Absent"}</td>
          </tr>
        `;
      });
    }

    historyHTML += `</tbody></table>`;
    historyHTML += `<button id="backToDashboard">⬅️ Back to Dashboard</button>`;

    const container = document.getElementById("studentAttendanceContainer");
    container.innerHTML = historyHTML;

    document.getElementById("backToDashboard").addEventListener("click", () => {
      container.innerHTML = "";
      showPage("dashboardPage");
      loadDashboard();
    });

    showPage("dashboardPage");

  } catch (err) {
    console.error(err);
  }
}

// -------- INIT --------
loadDashboard();
loadStudents();
