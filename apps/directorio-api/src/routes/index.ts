import { Router, type IRouter } from "express";
import healthRouter from "./health";
import operatorsRouter from "./operators";
import rankingsRouter from "./rankings";
import analyticsRouter from "./analytics";
import ingestaRouter from "./ingesta";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(operatorsRouter);
router.use(rankingsRouter);
router.use(analyticsRouter);
router.use(ingestaRouter);
router.use(contactRouter);

export default router;
