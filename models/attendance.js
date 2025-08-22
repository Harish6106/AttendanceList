// models/Attendance.js
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    status: { type: String, enum: ["Present", "Absent"], required: true }
  },
  { timestamps: true }
);

// one record per student per date
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
