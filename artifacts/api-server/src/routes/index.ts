import { Router, type IRouter } from "express";
import healthRouter from "./health";
import operatorsRouter from "./operators";
import rankingsRouter from "./rankings";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(operatorsRouter);
router.use(rankingsRouter);
router.use(analyticsRouter);

export default router;
