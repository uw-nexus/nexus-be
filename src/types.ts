export type Student = {
  _id?: string;
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  dob?: Date;
  school?: string;
  standing?: string;
  city?: string;
  country?: string;
};

export type Project = {
  _id?: string;
  ownerEmail: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  status?: string;
};
