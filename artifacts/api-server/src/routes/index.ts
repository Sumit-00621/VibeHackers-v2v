import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import aiRouter from "./ai.js";
import scholarshipsRouter from "./scholarships.js";
import learningRouter from "./learning.js";
import mentorsRouter from "./mentors.js";
import dashboardRouter from "./dashboard.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/ai", aiRouter);
router.use("/scholarships", scholarshipsRouter);
router.use("/learning", learningRouter);
router.use("/mentors", mentorsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
