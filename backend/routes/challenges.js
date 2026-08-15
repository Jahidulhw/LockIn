const express = require('express');
const router = express.Router();
const db = require('../config/firebase');
const auth = require('../middleware/auth');

router.use(auth);

const CHALLENGES = db.collection('challenges');

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function toDateStr(date) {
  return date.toISOString().split('T')[0];
}

function computeEndDate(startDate) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + 29);
  return toDateStr(d);
}

function docToObj(doc) {
  return { _id: doc.id, ...doc.data() };
}

async function getOwned(docId, userId) {
  const doc = await CHALLENGES.doc(docId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (data.userId !== userId) return null;
  return { doc, obj: docToObj(doc) };
}

// GET /api/challenges
router.get('/', async (req, res) => {
  try {
    const snap = await CHALLENGES.where('userId', '==', req.user.id).get();
    const challenges = snap.docs
      .map(docToObj)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/challenges/:id
router.get('/:id', async (req, res) => {
  try {
    const owned = await getOwned(req.params.id, req.user.id);
    if (!owned) return res.status(404).json({ error: 'Challenge not found' });
    res.json(owned.obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/challenges
router.post('/', async (req, res) => {
  try {
    const { name, startDate, habits = [], plantType = 'flower', plantRarity = 'common' } = req.body;
    if (!name || !startDate) {
      return res.status(400).json({ error: 'name and startDate are required' });
    }
    const processedHabits = habits.map((h) => ({
      id: h.id || generateId(),
      name: h.name,
      target: h.target !== undefined ? h.target : true,
      unit: h.unit || ''
    }));
    const data = {
      userId: req.user.id,
      name,
      startDate,
      endDate: computeEndDate(startDate),
      habits: processedHabits,
      completions: [],
      checklist: [],
      plantType,
      plantRarity,
      createdAt: new Date().toISOString()
    };
    const ref = await CHALLENGES.add(data);
    res.status(201).json({ _id: ref.id, ...data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/challenges/:id
router.delete('/:id', async (req, res) => {
  try {
    const owned = await getOwned(req.params.id, req.user.id);
    if (!owned) return res.status(404).json({ error: 'Challenge not found' });
    await CHALLENGES.doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/challenges/:id
router.put('/:id', async (req, res) => {
  try {
    const owned = await getOwned(req.params.id, req.user.id);
    if (!owned) return res.status(404).json({ error: 'Challenge not found' });
    const { userId, createdAt, ...updates } = req.body;
    if (updates.startDate) updates.endDate = computeEndDate(updates.startDate);
    await CHALLENGES.doc(req.params.id).update(updates);
    const updated = await CHALLENGES.doc(req.params.id).get();
    res.json(docToObj(updated));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/challenges/:id/habits/:habitId/complete
router.post('/:id/habits/:habitId/complete', async (req, res) => {
  try {
    const { date } = req.body;
    // Bug fix: validate date format and ensure it falls within the challenge window
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    }

    const owned = await getOwned(req.params.id, req.user.id);
    if (!owned) return res.status(404).json({ error: 'Challenge not found' });

    const { obj } = owned;
    if (date < obj.startDate || date > obj.endDate) {
      return res.status(400).json({ error: 'date is outside the challenge window' });
    }
    const habitExists = obj.habits.some((h) => h.id === req.params.habitId);
    if (!habitExists) return res.status(404).json({ error: 'Habit not found' });

    const completions = [...(obj.completions || [])];
    const dayIdx = completions.findIndex((c) => c.date === date);

    if (dayIdx === -1) {
      completions.push({ date, habits: [{ habitId: req.params.habitId, completed: true }] });
    } else {
      const day = { ...completions[dayIdx], habits: [...completions[dayIdx].habits] };
      const habitIdx = day.habits.findIndex((h) => h.habitId === req.params.habitId);
      if (habitIdx === -1) {
        day.habits.push({ habitId: req.params.habitId, completed: true });
      } else {
        day.habits[habitIdx] = { ...day.habits[habitIdx], completed: !day.habits[habitIdx].completed };
      }
      completions[dayIdx] = day;
    }

    await CHALLENGES.doc(req.params.id).update({ completions });
    res.json({ ...obj, completions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/challenges/:id/progress
router.get('/:id/progress', async (req, res) => {
  try {
    const owned = await getOwned(req.params.id, req.user.id);
    if (!owned) return res.status(404).json({ error: 'Challenge not found' });

    const { obj } = owned;
    const startDate = new Date(obj.startDate);
    const totalHabits = obj.habits.length;
    const progress = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = toDateStr(date);
      const dayEntry = (obj.completions || []).find((c) => c.date === dateStr);
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
    const owned = await getOwned(req.params.id, req.user.id);
    if (!owned) return res.status(404).json({ error: 'Challenge not found' });

    const { obj } = owned;
    const startDate = new Date(obj.startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const totalHabits = obj.habits.length;

    const dailyHistory = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = toDateStr(date);
      const isPast = date <= today;
      const dayEntry = (obj.completions || []).find((c) => c.date === dateStr);
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

    const habitStats = obj.habits.map((habit) => {
      let totalCompleted = 0;
      let eligibleDays = 0;
      dailyHistory.forEach((day) => {
        if (day.isPast) {
          eligibleDays++;
          const dayEntry = (obj.completions || []).find((c) => c.date === day.date);
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
      challenge: { name: obj.name, startDate: obj.startDate, endDate: obj.endDate },
      dailyHistory,
      habitStats: [...habitStats].sort((a, b) => b.completionRate - a.completionRate)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/challenges/:id/habits  (add habit to existing challenge)
router.post('/:id/habits', async (req, res) => {
  try {
    const { name, target, unit } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const owned = await getOwned(req.params.id, req.user.id);
    if (!owned) return res.status(404).json({ error: 'Challenge not found' });

    const habits = [...owned.obj.habits, {
      id: generateId(),
      name: name.trim(),
      target: target !== undefined ? target : true,
      unit: unit || ''
    }];
    await CHALLENGES.doc(req.params.id).update({ habits });
    res.json({ ...owned.obj, habits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/challenges/:id/habits/:habitId
router.delete('/:id/habits/:habitId', async (req, res) => {
  try {
    const owned = await getOwned(req.params.id, req.user.id);
    if (!owned) return res.status(404).json({ error: 'Challenge not found' });

    const { habitId } = req.params;
    const habits = owned.obj.habits.filter((h) => h.id !== habitId);
    // Bug fix: also strip the deleted habit from all past completion records,
    // otherwise the completed count can exceed the habit count (>100% progress).
    const completions = (owned.obj.completions || []).map((day) => ({
      ...day,
      habits: day.habits.filter((h) => h.habitId !== habitId),
    }));
    await CHALLENGES.doc(req.params.id).update({ habits, completions });
    res.json({ ...owned.obj, habits, completions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/challenges/:id/checklist  (add checklist item)
router.post('/:id/checklist', async (req, res) => {
  try {
    const { text } = req.body;
    const trimmed = (text || '').trim();
    if (!trimmed) return res.status(400).json({ error: 'text is required' });

    const owned = await getOwned(req.params.id, req.user.id);
    if (!owned) return res.status(404).json({ error: 'Challenge not found' });

    const checklist = [...(owned.obj.checklist || []), {
      id: generateId(),
      text: trimmed,
      done: false
    }];
    await CHALLENGES.doc(req.params.id).update({ checklist });
    res.json({ ...owned.obj, checklist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/challenges/:id/checklist/:itemId/toggle
router.post('/:id/checklist/:itemId/toggle', async (req, res) => {
  try {
    const owned = await getOwned(req.params.id, req.user.id);
    if (!owned) return res.status(404).json({ error: 'Challenge not found' });

    const checklist = (owned.obj.checklist || []).map((item) =>
      item.id === req.params.itemId ? { ...item, done: !item.done } : item
    );
    await CHALLENGES.doc(req.params.id).update({ checklist });
    res.json({ ...owned.obj, checklist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/challenges/:id/checklist/:itemId
router.delete('/:id/checklist/:itemId', async (req, res) => {
  try {
    const owned = await getOwned(req.params.id, req.user.id);
    if (!owned) return res.status(404).json({ error: 'Challenge not found' });

    const checklist = (owned.obj.checklist || []).filter((item) => item.id !== req.params.itemId);
    await CHALLENGES.doc(req.params.id).update({ checklist });
    res.json({ ...owned.obj, checklist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/challenges/:id/reset
router.post('/:id/reset', async (req, res) => {
  try {
    const owned = await getOwned(req.params.id, req.user.id);
    if (!owned) return res.status(404).json({ error: 'Challenge not found' });

    await CHALLENGES.doc(req.params.id).update({ completions: [] });
    res.json({ ...owned.obj, completions: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
