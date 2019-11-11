import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import passport from 'passport';
import config from './config';
import db from './db';
import addPassports from './middlewares/passport';

import registerAuthRoutes from './routes/auth';
import registerStudentRoutes from './routes/students';
import registerProjectRoutes from './routes/projects';

const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors());

app.use(passport.initialize());
addPassports(db.promisePool);

app.get('/', (req: Request, res: Response) => res.send('NEXUS UW App Backend'));
registerAuthRoutes(app, db.promisePool);
registerStudentRoutes(app, db.promisePool);
registerProjectRoutes(app, db.promisePool);

app.listen(config.PORT, () => console.log(`Server running on port ${config.PORT}`));
