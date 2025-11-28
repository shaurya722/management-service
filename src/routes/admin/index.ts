import express, { Router } from 'express';
import companyRouter from './company.route';

const router: Router = express.Router();

router.use('/company', companyRouter);

export default router;
