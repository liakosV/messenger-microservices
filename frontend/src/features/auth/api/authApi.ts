import { json, request } from '../../../shared/api/client';
import type { Profile } from '../../profile/model/types';

export interface LoginInput {
  identifier: string;
  password: string;
}
export type RegistrationInput = Omit<Profile, 'uuid'> & { password: string };
export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export const authApi = {
  login: (input: LoginInput) =>
    request<AuthResponse>('/identity/api/auth/login', undefined, json(input)),
  register: (input: RegistrationInput) =>
    request<Profile>('/identity/api/auth/register', undefined, json(input)),
};
