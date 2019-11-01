import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

app.get('/', (req: Request, res: Response) => res.send('NEXUS UW App Backend'));

const { PORT } = process.env;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
