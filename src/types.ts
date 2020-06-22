export type User = {
  userId?: string;
  username: string;
  password?: string;
  userType?: string;
  provider?: string;
};

export type Student = {
  profile: StudentProfile;
  skills: string[];
  roles: string[];
  interests: string[];
};

export type StudentProfile = {
  studentId?: string;
  user?: User;
  firstName?: string;
  lastName?: string;
  email?: string;
  dob?: Date;
  bio?: string;
  school?: string;
  degree?: string;
  standing?: string;
  major1?: string;
  major2?: string;
  photoUrl?: string;
  resume?: string;
  linkedin?: string;
  website?: string;
  postal?: string;
};

export type Project = {
  details: ProjectDetails;
  skills: string[];
  roles: string[];
  interests: string[];
  exercises?: {
    [role: string]: string;
  };
};

export type ProjectDetails = {
  projectId?: string;
  owner?: StudentProfile;
  title: string;
  description?: string;
  status: string;
  duration: string;
  size: string;
  postal: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Contract = {
  contractId?: string;
  project?: ProjectDetails;
  student?: StudentProfile;
  status?: string;
};
