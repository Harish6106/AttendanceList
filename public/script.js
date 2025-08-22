const apiBase = "https://attendancelist.onrender.com"; // <-- your Render URL

// Navigation
document.getElementById("dashboardBtn").addEventListener("click", () => {
  loadDashboard();
  showPage("dashboardPage");
});

document.getElementById("studentsBtn").addEventListener("click", () => {
  loadStudents();
  showPage("studentsPage");
});

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
}

// Load students
async function loadStudents() {
  const res = await fetch(`${apiBase}/students`);
  const students = await res.json();
  renderStudents(students);
}

function renderStudents(students) {
  const tbody = document.getElementById("studentTableBody");
  tbody.innerHTML = "";

  students.forEach(student => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="student-link" data-id="${student._id}">${student.name}</td>
      <td>
        <button onclick="markAttendance('${student._id}','Present')">✅</button>
        <button onclick="markAttendance('${student._id}','Absent')">❌</button>
      </td>
      <td>
        <button onclick="deleteStudent('${student._id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(row);

    row.querySelector(".student-link").addEventListener("click", () => {
      showStudentAttendance(student._id, student.name);
    });
  });
}

// Add student
document.getElementById("studentForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("studentName").value.trim();
  if (!name) return alert("Enter a name");

  try {
    const res = await fetch(`${apiBase}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    if (!res.ok) {
      const err = await res.json();
      return alert(err.error);
    }

    document.getElementById("studentName").value = "";
    loadStudents();
  } catch (err) {
    alert("Failed to add student: " + err.message);
  }
});

// Delete student
async function deleteStudent(id) {
  await fetch(`${apiBase}/students/${id}`, { method: "DELETE" });
  loadStudents();
}

// Mark attendance
async function markAttendance(studentId, status) {
  await fetch(`${apiBase}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, status, date: new Date() })
  });
  loadDashboard();
}

// Dashboard
async function loadDashboard() {
  const res = await fetch(`${apiBase}/attendance`);
  const records = await res.json();
  let present = 0, absent = 0;

  records.forEach(r => r.status === "Present" ? present++ : absent++);
  document.getElementById("dashboardPage").innerHTML = `
    <h1>📊 Dashboard</h1>
    <p>Total Records: ${records.length}</p>
    <p>✅ Present: ${present}</p>
    <p>❌ Absent: ${absent}</p>
  `;
}

// Student attendance
async function showStudentAttendance(studentId, name) {
  const res = await fetch(`${apiBase}/attendance/${studentId}`);
  const data = await res.json();

  let historyHTML = `<h2>Attendance for ${name}</h2><table><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>`;
  data.forEach(r => {
    historyHTML += `<tr><td>${new Date(r.date).toLocaleDateString()}</td><td>${r.status}</td></tr>`;
  });
  historyHTML += "</tbody></table>";

  document.getElementById("dashboardPage").innerHTML = historyHTML;
  showPage("dashboardPage");
}

// Initialize
loadDashboard();
