import { Router, type IRouter } from "express";
import healthRouter from "./health";
import diagnoseRouter from "./diagnose";
import growPlanRouter from "./grow-plan";
import marketRouter from "./market";
import landRouter from "./land";
import weatherRouter from "./weather";
import cropsRouter from "./crops";
import communityRouter from "./community";

const router: IRouter = Router();

router.use(healthRouter);
router.use(diagnoseRouter);
router.use(growPlanRouter);
router.use(marketRouter);
router.use(landRouter);
router.use(weatherRouter);
router.use(cropsRouter);
router.use(communityRouter);

export default router;
