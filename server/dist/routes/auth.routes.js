"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authRouter = (0, express_1.Router)();
exports.authRouter = authRouter;
authRouter.post('/register', auth_controller_1.register);
authRouter.post('/login', auth_controller_1.login);
authRouter.get('/me', auth_middleware_1.authMiddleware, auth_controller_1.me);
authRouter.put('/me', auth_middleware_1.authMiddleware, auth_controller_1.updateUser);
authRouter.delete('/me', auth_middleware_1.authMiddleware, auth_controller_1.deleteUser);
//# sourceMappingURL=auth.routes.js.map