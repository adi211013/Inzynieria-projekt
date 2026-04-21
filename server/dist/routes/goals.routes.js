"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.goalsRouter = void 0;
const goals_controller_1 = require("../controllers/goals.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_1 = require("express");
const goalsRouter = (0, express_1.Router)();
exports.goalsRouter = goalsRouter;
goalsRouter.use(auth_middleware_1.authMiddleware);
goalsRouter.get('/', goals_controller_1.getGoals);
goalsRouter.get('/:id', goals_controller_1.getGoal);
goalsRouter.post('/', goals_controller_1.createGoal);
goalsRouter.put('/:id', goals_controller_1.updateGoal);
goalsRouter.delete('/:id', goals_controller_1.deleteGoal);
//# sourceMappingURL=goals.routes.js.map