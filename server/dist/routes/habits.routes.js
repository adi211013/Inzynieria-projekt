"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.habitsRouter = void 0;
const habits_controller_1 = require("../controllers/habits.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const express_1 = require("express");
const habitsRouter = (0, express_1.Router)();
exports.habitsRouter = habitsRouter;
habitsRouter.use(auth_middleware_1.authMiddleware);
habitsRouter.get('/', habits_controller_1.getHabits);
habitsRouter.get('/:id', habits_controller_1.getHabit);
habitsRouter.post('/', habits_controller_1.createHabit);
habitsRouter.put('/:id', habits_controller_1.updateHabit);
habitsRouter.delete('/:id', habits_controller_1.deleteHabit);
//# sourceMappingURL=habits.routes.js.map