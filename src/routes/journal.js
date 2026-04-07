const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const auth = require('../middleware/auth');

/**
 * POST /sync
 * Syncs journal entries from the Android app to Supabase.
 * Body: { entries: [ { title, content, date } ] }
 * Note: Uses INSERT (not upsert) to allow multiple journal entries per day.
 */
router.post('/sync', auth, async (req, res) => {
  try {
    const { entries } = req.body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'entries array is required and must not be empty' });
    }

    const rows = entries.map((e) => ({
      user_id: req.userId,
      title: e.title,
      content: e.content,
      date: e.date,
    }));

    const { data, error } = await supabase
      .from('journal_entries')
      .insert(rows);

    if (error) {
      console.error('Supabase journal sync error:', error);
      return res.status(500).json({ error: 'Failed to sync journal entries' });
    }

    return res.json({ success: true, synced: rows.length });
  } catch (error) {
    console.error('Journal sync error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
