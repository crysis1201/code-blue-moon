export type UserRole = 'household' | 'helper' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface VerifyOtpResponse extends AuthTokens {
  isNewUser: boolean;
  user: {
    id: string;
    phone: string;
    role: UserRole;
    fullName: string | null;
  };
}
