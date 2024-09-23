"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./logger");
const db_1 = __importDefault(require("./config/db"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
dotenv_1.default.config();
const stream = {
    write: (message) => {
        logger_1.logger.info(message.trim());
    },
};
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Connect to database
(0, db_1.default)();
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Skip logging during tests
// const skip = () => {
//   const env = process.env.NODE_ENV || 'development';
//   return env === 'test';
// };
// Use morgan middleware for logging HTTP requests
// app.use(morgan('combined', { stream, skip }));
// app.use(requestLogger);
// Routes
app.use('/api/v1/admin', adminRoutes_1.default);
app.listen(PORT, () => {
    logger_1.logger.info(`Server is running on http://localhost:${PORT}`);
});
