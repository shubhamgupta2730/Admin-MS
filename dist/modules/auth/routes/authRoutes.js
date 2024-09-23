"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const signupController_1 = require("../controllers/signupController");
const signinController_1 = require("../controllers/signinController");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post('/signup', signupController_1.signUp);
router.post('/sign-in', signinController_1.singIn);
exports.default = router;
