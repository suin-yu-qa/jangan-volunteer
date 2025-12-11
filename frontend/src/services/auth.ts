import api from './api';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types';

export const authService = {
  // 이메일 로그인
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  // 회원가입
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // 소셜 로그인 URL 가져오기
  getSocialLoginUrl(provider: 'google' | 'kakao'): string {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    return `${baseUrl}/auth/social/${provider}`;
  },

  // 소셜 로그인 콜백 처리
  async handleSocialCallback(provider: 'google' | 'kakao', code: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(`/auth/social/${provider}/callback`, { code });
    return response.data;
  },

  // 내 정보 조회
  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  // 토큰 갱신
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  // 로그아웃
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  // FCM 토큰 등록
  async registerFcmToken(token: string): Promise<void> {
    await api.post('/notifications/register-token', { token });
  },

  // 프로필 수정
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<User>('/auth/me', data);
    return response.data;
  },
};
