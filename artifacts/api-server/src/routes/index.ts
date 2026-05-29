import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import classesRouter from "./classes";
import subjectsRouter from "./subjects";
import studentsRouter from "./students";
import gradesRouter from "./grades";
import statsRouter from "./stats";
import archivesRouter from "./archives";
import reportsRouter from "./reports";
import deliberationsRouter from "./deliberations";
import messagesRouter from "./messages";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(classesRouter);
router.use(subjectsRouter);
router.use(studentsRouter);
router.use(gradesRouter);
router.use(statsRouter);
router.use(archivesRouter);
router.use(reportsRouter);
router.use(deliberationsRouter);
router.use(messagesRouter);

export default router;
