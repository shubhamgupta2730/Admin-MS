"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getDashboardSale_1 = require("../controllers/getDashboardSale");
const express_1 = require("express");
const router = (0, express_1.Router)();
const authMiddleware_1 = require("../../../../middlewares/authMiddleware");
router.get('/get-total-sales', authMiddleware_1.authenticateAdmin, authMiddleware_1.authorizeAdmin, getDashboardSale_1.getSalesAnalytics);
exports.default = router;
