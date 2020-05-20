import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import { FE_ADDR, PORT } from './config';
import db from './db';
import addPassports from './middlewares/passport';
import registerRoutes from './routes';

const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors({ credentials: true, origin: FE_ADDR }));
app.use(cookieParser());

app.use('/documentation', express.static('public'));

app.use(passport.initialize());
addPassports(db.promisePool);

app.get('/', (req: Request, res: Response) => res.send('NEXUS UW App Backend'));
registerRoutes(app, db.promisePool);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
