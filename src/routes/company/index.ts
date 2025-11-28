import express, { Router } from 'express';
import categoryRouter from './category.route';
import detectorRouter from './detector.route';
import jobRouter from './job.route';
import logRouter from './log.route';
import policyRouter from './policy.route';
import probeRouter from './probe.route';
import projectRouter from './project.route';

const router: Router = express.Router();

router.use('/detector', detectorRouter);
router.use('/probe', probeRouter);
router.use('/category', categoryRouter);
router.use('/policy', policyRouter);
router.use('/project', projectRouter);
router.use('/job', jobRouter);
router.use('/log', logRouter);

export default router;
