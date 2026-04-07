const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const auth = require('../middleware/auth');

/**
 * POST /sync
 * Syncs health metrics from the Android app to Supabase.
 * Body: { metrics: [ { heartRate, spo2, systolic, diastolic, stress, steps, calories, distance, recordedAt } ] }
 */
router.post('/sync', auth, async (req, res) => {
  try {
    // MOCK USER ID FOR TESTING
    // req.userId = 'mock-user-id-123';

    const { metrics } = req.body;

    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return res.status(400).json({ error: 'metrics array is required and must not be empty' });
    }

    const rows = metrics.map((m) => ({
      user_id: req.userId,
      heart_rate: m.heartRate,
      spo2: m.spo2,
      systolic: m.systolic,
      diastolic: m.diastolic,
      stress: m.stress,
      steps: m.steps,
      calories: m.calories,
      distance: m.distance,
      recorded_at: m.recordedAt,
    }));

    const { data, error } = await supabase
      .from('health_metrics')
      .upsert(rows, { onConflict: 'user_id,recorded_at' });

    if (error) {
      console.error('Supabase health sync error:', error);
      return res.status(500).json({ error: 'Failed to sync health metrics' });
    }

    return res.json({ success: true, synced: rows.length });
  } catch (error) {
    console.error('Health sync error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /recent
 * Returns health metrics for the last 7 days for the authenticated user.
 */
router.get('/recent', auth, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', req.userId)
      .gte('recorded_at', sevenDaysAgo.toISOString())
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('Supabase health recent error:', error);
      return res.status(500).json({ error: 'Failed to fetch recent health metrics' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Health recent error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
