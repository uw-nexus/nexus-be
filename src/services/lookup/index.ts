import { Pool, RowDataPacket } from 'mysql2/promise';
import * as SQL from './sql';

type ArrayChoices = {
  skills: string[];
  roles: string[];
  interests: string[];
};

export default class LookupService {
  db: Pool;

  constructor(promisePool: Pool) {
    this.db = promisePool;
  }

  async getArrayChoices(): Promise<ArrayChoices> {
    const [sRes] = await this.db.execute(SQL.getSkills);
    const [rRes] = await this.db.execute(SQL.getRoles);
    const [iRes] = await this.db.execute(SQL.getInterests);
    const skills: string[] = (sRes as RowDataPacket[]).map(row => row.name);
    const roles: string[] = (rRes as RowDataPacket[]).map(row => row.name);
    const interests: string[] = (iRes as RowDataPacket[]).map(row => row.name);
    return { skills, roles, interests };
  }

  async getProjectChoices(): Promise<ArrayChoices & { durations: string[]; sizes: string[] }> {
    const [dRes] = await this.db.execute(SQL.getDurations);
    const [sRes] = await this.db.execute(SQL.getTeamSizes);
    const durations: string[] = (dRes as RowDataPacket[]).map(row => row.name);
    const sizes: string[] = (sRes as RowDataPacket[]).map(row => row.name);

    const arrayChoices = await this.getArrayChoices();

    return { durations, sizes, ...arrayChoices };
  }

  async getStudentChoices(): Promise<ArrayChoices & { schools: string[]; majors: string[]; degrees: string[] }> {
    const [sRes] = await this.db.execute(SQL.getSchools);
    const [mRes] = await this.db.execute(SQL.getMajors);
    const [dRes] = await this.db.execute(SQL.getDegrees);
    const schools: string[] = (sRes as RowDataPacket[]).map(row => row.name);
    const majors: string[] = (mRes as RowDataPacket[]).map(row => row.name);
    const degrees: string[] = (dRes as RowDataPacket[]).map(row => row.name);

    const arrayChoices = await this.getArrayChoices();

    return { degrees, schools, majors, ...arrayChoices };
  }
}
