"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const deleteReview_1 = require("../controllers/deleteReview");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.delete('/remove-review', authMiddleware_1.authenticateAdmin, authMiddleware_1.authorizeAdmin, deleteReview_1.removeReview);
exports.default = router;
