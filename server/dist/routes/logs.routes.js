"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logsRouter = void 0;
const logs_controller_1 = require("../controllers/logs.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_1 = require("express");
const logsRouter = (0, express_1.Router)();
exports.logsRouter = logsRouter;
logsRouter.use(auth_middleware_1.authMiddleware);
logsRouter.post('/', logs_controller_1.createLog);
logsRouter.delete('/', logs_controller_1.deleteLog);
//# sourceMappingURL=logs.routes.js.map