import type { UserResponse } from 'src/services/auth.service';

export interface AuthState {
  user: UserResponse | null;
  loading: boolean;
  error: string | null;
}