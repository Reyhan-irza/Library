import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import meRouter from "./me";
import booksRouter from "./books";
import categoriesRouter from "./categories";
import racksRouter from "./racks";
import membersRouter from "./members";
import borrowingsRouter from "./borrowings";
import favoritesRouter from "./favorites";
import staffRouter from "./staff";
import dashboardRouter from "./dashboard";
import notificationsRouter from "./notifications";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/me", meRouter);
router.use("/books", booksRouter);
router.use("/categories", categoriesRouter);
router.use("/racks", racksRouter);
router.use("/members", membersRouter);
router.use("/borrowings", borrowingsRouter);
router.use("/favorites", favoritesRouter);
router.use("/staff", staffRouter);
router.use("/dashboard", dashboardRouter);
router.use("/notifications", notificationsRouter);
router.use("/reports", reportsRouter);

export default router;
