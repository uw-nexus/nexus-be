import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import passport from 'passport';

import { PORT } from './config';
import db from './db';
import addPassports from './middlewares/passport';
import registerRoutes from './routes';

const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors());

app.use(passport.initialize());
addPassports(db.promisePool);

app.get('/', (req: Request, res: Response) => res.send('NEXUS UW App Backend'));
registerRoutes(app, db.promisePool);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
