import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import complexesRouter from "./complexes";
import materialsRouter from "./materials";
import eventsRouter from "./events";
import recordsRouter from "./records";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";
import profileRouter from "./profile";
import settingsRouter from "./settings";
import auditLogsRouter from "./auditLogs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(complexesRouter);
router.use(materialsRouter);
router.use(eventsRouter);
router.use(recordsRouter);
router.use(dashboardRouter);
router.use(reportsRouter);
router.use(profileRouter);
router.use(settingsRouter);
router.use(auditLogsRouter);

export default router;
