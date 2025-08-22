const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require('dotenv').config();

const Student = require("./models/Student");
const Attendance = require("./models/attendance");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ✅ MongoDB connection
mongoose.connect("process.env.MONGO_URI")
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error(err));

// -------------------- STUDENTS --------------------

// Add a student
app.post("/students", async (req, res) => {
  try {
    const student = new Student({ name: req.body.name });
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all students
app.get("/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete student
app.delete("/students/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- ATTENDANCE --------------------

// Mark or update attendance
app.post("/attendance", async (req, res) => {
  try {
    let { studentId, status, date } = req.body;
    if (!studentId || !status) return res.status(400).json({ error: "studentId and status are required" });

    // Normalize date to midnight
    const d = new Date(date || new Date());
    d.setHours(0, 0, 0, 0);

    const record = await Attendance.findOneAndUpdate(
      { studentId: studentId, date: d },
      { $set: { status } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, attendance: record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all attendance
app.get("/attendance", async (req, res) => {
  try {
    const records = await Attendance.find();
    // Ensure studentId is string for front-end
    const formatted = records.map(r => ({
      _id: r._id,
      studentId: String(r.studentId),
      status: r.status,
      date: r.date
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get attendance for one student
app.get("/attendance/:studentId", async (req, res) => {
  try {
    const records = await Attendance.find({ studentId: req.params.studentId });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- STATS --------------------
app.get("/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);

    const totalStudents = await Student.countDocuments();
    const presentCount = await Attendance.countDocuments({ date: today, status: "Present" });
    const absentCount = await Attendance.countDocuments({ date: today, status: "Absent" });

    res.json({
      total: totalStudents,
      present: presentCount,
      absent: absentCount,
      notMarked: totalStudents - (presentCount + absentCount),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- START SERVER --------------------

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
