import { Router, type IRouter } from "express";
import healthRouter from "./health";
import diagnoseRouter from "./diagnose";
import growPlanRouter from "./grow-plan";
import marketRouter from "./market";

const router: IRouter = Router();

router.use(healthRouter);
router.use(diagnoseRouter);
router.use(growPlanRouter);
router.use(marketRouter);

export default router;
