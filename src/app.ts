import express, { Request, Response } from 'express';
import cors from 'cors';
import config from './config';

const app = express();
app.use(cors());

app.get('/', (req: Request, res: Response) => res.send('NEXUS UW App Backend'));

app.listen(config.PORT, () => console.log(`Server running on port ${config.PORT}`));
