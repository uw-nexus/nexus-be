export type Student = {
  profile: StudentProfile;
  majors: string[];
  skills: string[];
};

export type StudentProfile = {
  _id?: string;
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  dob?: Date;
  school?: string;
  standing?: string;
  location?: Location;
};

export type Project = {
  details: ProjectDetails;
  fields: string[];
  skills: string[];
  locations: Location[];
};

export type ProjectDetails = {
  _id?: string;
  owner?: StudentProfile;
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Location = {
  city: string;
  state?: string;
  country: string;
};

export type Contract = {
  _id?: string;
  project?: ProjectDetails;
  student?: StudentProfile;
  startDate?: Date;
  endDate?: Date;
  status?: string;
};
