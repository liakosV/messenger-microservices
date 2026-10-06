export interface Profile {
  uuid: string;
  username: string;
  email: string;
  dateOfBirth: string;
  phoneNumber: string;
}

export type ProfilePatch = Partial<Omit<Profile, 'uuid'>> & { password?: string };
