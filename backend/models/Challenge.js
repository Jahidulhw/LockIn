const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    target: mongoose.Schema.Types.Mixed,
    unit: String
  },
  { _id: false }
);

const HabitCompletionSchema = new mongoose.Schema(
  {
    habitId: { type: String, required: true },
    completed: { type: Boolean, default: false },
    amount: Number
  },
  { _id: false }
);

const DayCompletionSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    habits: [HabitCompletionSchema]
  },
  { _id: false }
);

const DayNoteSchema = new mongoose.Schema(
  { date: { type: String, required: true }, text: { type: String, default: '' } },
  { _id: false }
);

const ChallengeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    startDate: { type: String, required: true }, // YYYY-MM-DD
    endDate: { type: String },
    habits: [HabitSchema],
    completions: [DayCompletionSchema],
    notes: [DayNoteSchema]
  },
  { timestamps: true }
);

// Auto-compute endDate before save
ChallengeSchema.pre('save', function (next) {
  if (this.startDate && !this.endDate) {
    const start = new Date(this.startDate);
    start.setDate(start.getDate() + 29); // 30 days inclusive
    this.endDate = start.toISOString().split('T')[0];
  }
  next();
});

module.exports = mongoose.model('Challenge', ChallengeSchema);
