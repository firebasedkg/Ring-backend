const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const auth = require('../middleware/auth');

/**
 * POST /sync
 * Syncs streak entries from the Android app to Supabase.
 * Body: { entries: [ { activityType, date } ] }
 */
router.post('/sync', auth, async (req, res) => {
  try {
    const { entries } = req.body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'entries array is required and must not be empty' });
    }

    const rows = entries.map((e) => ({
      user_id: req.userId,
      activity_type: e.activityType,
      date: e.date,
    }));

    const { data, error } = await supabase
      .from('streak_entries')
      .upsert(rows, { onConflict: 'user_id,activity_type,date' });

    if (error) {
      console.error('Supabase streaks sync error:', error);
      return res.status(500).json({ error: 'Failed to sync streak entries' });
    }

    return res.json({ success: true, synced: rows.length });
  } catch (error) {
    console.error('Streaks sync error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
