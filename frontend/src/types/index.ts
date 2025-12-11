// 사용자 관련 타입
export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'user';
  provider: 'email' | 'google' | 'kakao';
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// 봉사 일정 관련 타입
export interface Schedule {
  id: number;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  createdBy: number;
  createdAt: string;
  applicantCount?: number;
  isApplied?: boolean;
}

export interface ScheduleCreateRequest {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
}

// 지원 관련 타입
export interface Application {
  id: number;
  userId: number;
  scheduleId: number;
  status: 'applied' | 'cancelled';
  appliedAt: string;
  cancelledAt?: string;
  schedule?: Schedule;
  user?: User;
}

// 공지사항 관련 타입
export interface Notice {
  id: number;
  title: string;
  content: string;
  isImportant: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  author?: User;
}

export interface NoticeCreateRequest {
  title: string;
  content: string;
  isImportant?: boolean;
}

// 알림 관련 타입
export interface Notification {
  id: number;
  userId: number;
  title: string;
  body: string;
  type: 'schedule' | 'notice' | 'reminder';
  isRead: boolean;
  createdAt: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
