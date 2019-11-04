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
  details: ProjectDetails;
  fields: string[];
  skills: string[];
  locations: Location[];
};

export type ProjectDetails = {
  _id?: string;
  ownerEmail: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  status?: string;
};

export type Location = {
  city: string;
  state?: string;
  country: string;
};
