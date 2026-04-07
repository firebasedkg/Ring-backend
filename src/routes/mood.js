const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const auth = require('../middleware/auth');

/**
 * POST /sync
 * Syncs mood entries from the Android app to Supabase.
 * Body: { entries: [ { score, message, date, timestamp } ] }
 */
router.post('/sync', auth, async (req, res) => {
  try {
    const { entries } = req.body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'entries array is required and must not be empty' });
    }

    const rows = entries.map((e) => ({
      user_id: req.userId,
      score: e.score,
      message: e.message,
      date: e.date,
      timestamp: e.timestamp,
    }));

    const { data, error } = await supabase
      .from('mood_entries')
      .upsert(rows, { onConflict: 'user_id,date' });

    if (error) {
      console.error('Supabase mood sync error:', error);
      return res.status(500).json({ error: 'Failed to sync mood entries' });
    }

    return res.json({ success: true, synced: rows.length });
  } catch (error) {
    console.error('Mood sync error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
