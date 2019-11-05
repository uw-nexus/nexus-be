import express, { Request, Response } from 'express';
import cors from 'cors';
import config from './config';
import db from './db';
import registerStudentRoutes from './routes/students';
import registerProjectRoutes from './routes/projects';

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req: Request, res: Response) => res.send('NEXUS UW App Backend'));
registerStudentRoutes(app, db.promisePool);
registerProjectRoutes(app, db.promisePool);

app.listen(config.PORT, () => console.log(`Server running on port ${config.PORT}`));
