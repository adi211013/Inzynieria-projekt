"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRouter = void 0;
const stats_controller_1 = require("../controllers/stats.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_1 = require("express");
const statsRouter = (0, express_1.Router)();
exports.statsRouter = statsRouter;
statsRouter.use(auth_middleware_1.authMiddleware);
statsRouter.get('/overview', stats_controller_1.overview);
statsRouter.get('/habits/:id', stats_controller_1.habitStats);
//# sourceMappingURL=stats.routes.js.map