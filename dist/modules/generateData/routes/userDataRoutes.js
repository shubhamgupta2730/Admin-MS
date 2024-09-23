"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userData_1 = require("../controllers/userData");
const productData_1 = require("../controllers/productData");
const router = (0, express_1.Router)();
router.post('/generate-users', userData_1.generateUserData);
router.post('/generate-product-data', productData_1.generateProductData);
exports.default = router;
