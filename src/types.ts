export type User = {
  id?: string;
  username: string;
  password?: string;
  userType?: string;
  provider?: string;
};

export type Student = {
  profile: StudentProfile;
  majors: string[];
  skills: string[];
};

export type StudentProfile = {
  id?: string;
  user?: User;
  firstName?: string;
  lastName?: string;
  email?: string;
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
  id?: string;
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
  id?: string;
  project?: ProjectDetails;
  student?: StudentProfile;
  startDate?: Date;
  endDate?: Date;
  status?: string;
};
