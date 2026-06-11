const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const auth = require('../middleware/auth');

router.use(auth);

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function toDateStr(date) {
  return date.toISOString().split('T')[0];
}

// GET /api/challenges
router.get('/', async (req, res) => {
  try {
    const challenges = await Challenge.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/challenges/:id
router.get('/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findOne({ _id: req.params.id, userId: req.user.id });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    res.json(challenge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/challenges
router.post('/', async (req, res) => {
  try {
    const { name, startDate, habits = [] } = req.body;
    const processedHabits = habits.map((h) => ({
      id: h.id || generateId(),
      name: h.name,
      target: h.target || true,
      unit: h.unit || ''
    }));
    const challenge = new Challenge({ userId: req.user.id, name, startDate, habits: processedHabits });
    await challenge.save();
    res.status(201).json(challenge);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/challenges/:id
router.delete('/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/challenges/:id
router.put('/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    res.json(challenge);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/challenges/:id/habits/:habitId/complete
router.post('/:id/habits/:habitId/complete', async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'date is required' });

    const challenge = await Challenge.findOne({ _id: req.params.id, userId: req.user.id });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const habitExists = challenge.habits.some((h) => h.id === req.params.habitId);
    if (!habitExists) return res.status(404).json({ error: 'Habit not found' });

    let dayEntry = challenge.completions.find((c) => c.date === date);
    if (!dayEntry) {
      challenge.completions.push({ date, habits: [{ habitId: req.params.habitId, completed: true }] });
    } else {
      const habitEntry = dayEntry.habits.find((h) => h.habitId === req.params.habitId);
      if (!habitEntry) {
        dayEntry.habits.push({ habitId: req.params.habitId, completed: true });
      } else {
        habitEntry.completed = !habitEntry.completed;
      }
    }

    await challenge.save();
    res.json(challenge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/challenges/:id/progress
router.get('/:id/progress', async (req, res) => {
  try {
    const challenge = await Challenge.findOne({ _id: req.params.id, userId: req.user.id });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const startDate = new Date(challenge.startDate);
    const totalHabits = challenge.habits.length;
    const progress = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = toDateStr(date);
      const dayEntry = challenge.completions.find((c) => c.date === dateStr);
      const completedCount = dayEntry ? dayEntry.habits.filter((h) => h.completed).length : 0;
      progress.push({
        day: i + 1,
        date: dateStr,
        completed: completedCount,
        total: totalHabits,
        percentage: totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0
      });
    }

    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/challenges/:id/analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const challenge = await Challenge.findOne({ _id: req.params.id, userId: req.user.id });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const startDate = new Date(challenge.startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const totalHabits = challenge.habits.length;

    const dailyHistory = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = toDateStr(date);
      const isPast = date <= today;
      const dayEntry = challenge.completions.find((c) => c.date === dateStr);
      const completedCount = dayEntry ? dayEntry.habits.filter((h) => h.completed).length : 0;
      dailyHistory.push({
        day: i + 1,
        date: dateStr,
        completed: completedCount,
        total: totalHabits,
        percentage: totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0,
        isPast
      });
    }

    const habitStats = challenge.habits.map((habit) => {
      let totalCompleted = 0;
      let eligibleDays = 0;
      dailyHistory.forEach((day) => {
        if (day.isPast) {
          eligibleDays++;
          const dayEntry = challenge.completions.find((c) => c.date === day.date);
          if (dayEntry) {
            const habitEntry = dayEntry.habits.find((h) => h.habitId === habit.id);
            if (habitEntry?.completed) totalCompleted++;
          }
        }
      });
      return {
        habitId: habit.id,
        name: habit.name,
        target: habit.target,
        unit: habit.unit,
        totalCompleted,
        eligibleDays,
        completionRate: eligibleDays > 0 ? Math.round((totalCompleted / eligibleDays) * 100) : 0
      };
    });

    res.json({
      challenge: { name: challenge.name, startDate: challenge.startDate, endDate: challenge.endDate },
      dailyHistory,
      habitStats: [...habitStats].sort((a, b) => b.completionRate - a.completionRate)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/challenges/:id/habits  (add a habit to an existing challenge)
router.post('/:id/habits', async (req, res) => {
  try {
    const { name, target, unit } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const challenge = await Challenge.findOne({ _id: req.params.id, userId: req.user.id });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    challenge.habits.push({ id: generateId(), name: name.trim(), target: target || true, unit: unit || '' });
    await challenge.save();
    res.json(challenge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/challenges/:id/habits/:habitId
router.delete('/:id/habits/:habitId', async (req, res) => {
  try {
    const challenge = await Challenge.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $pull: { habits: { id: req.params.habitId } } },
      { new: true }
    );
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    res.json(challenge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/challenges/:id/notes
router.post('/:id/notes', async (req, res) => {
  try {
    const { date, text } = req.body;
    if (!date) return res.status(400).json({ error: 'date is required' });

    const challenge = await Challenge.findOne({ _id: req.params.id, userId: req.user.id });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const existing = challenge.notes.find((n) => n.date === date);
    const trimmed = (text || '').trim();

    if (!trimmed) {
      challenge.notes = challenge.notes.filter((n) => n.date !== date);
    } else if (existing) {
      existing.text = trimmed;
    } else {
      challenge.notes.push({ date, text: trimmed });
    }

    await challenge.save();
    res.json(challenge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/challenges/:id/reset
router.post('/:id/reset', async (req, res) => {
  try {
    const challenge = await Challenge.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { completions: [] } },
      { new: true }
    );
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    res.json(challenge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
