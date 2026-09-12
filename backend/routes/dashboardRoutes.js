const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/metrics', DashboardController.getMetrics);
router.get('/stock-breakdown', DashboardController.getStockBreakdown);
router.get('/recent-activity', DashboardController.getRecentActivity);

module.exports = router;
