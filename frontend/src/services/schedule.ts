import api from './api';
import type { Schedule, ScheduleCreateRequest, Application } from '../types';

export const scheduleService = {
  // 일정 목록 조회 (월별)
  async getSchedules(year: number, month: number): Promise<Schedule[]> {
    const response = await api.get<Schedule[]>('/schedules', {
      params: { year, month },
    });
    return response.data;
  },

  // 일정 상세 조회
  async getSchedule(id: number): Promise<Schedule> {
    const response = await api.get<Schedule>(`/schedules/${id}`);
    return response.data;
  },

  // 일정 생성 (관리자)
  async createSchedule(data: ScheduleCreateRequest): Promise<Schedule> {
    const response = await api.post<Schedule>('/schedules', data);
    return response.data;
  },

  // 일정 수정 (관리자)
  async updateSchedule(id: number, data: Partial<ScheduleCreateRequest>): Promise<Schedule> {
    const response = await api.put<Schedule>(`/schedules/${id}`, data);
    return response.data;
  },

  // 일정 삭제 (관리자)
  async deleteSchedule(id: number): Promise<void> {
    await api.delete(`/schedules/${id}`);
  },

  // 특정 날짜의 일정 조회
  async getSchedulesByDate(date: string): Promise<Schedule[]> {
    const response = await api.get<Schedule[]>('/schedules/by-date', {
      params: { date },
    });
    return response.data;
  },
};

export const applicationService = {
  // 내 지원 내역 조회
  async getMyApplications(): Promise<Application[]> {
    const response = await api.get<Application[]>('/applications/my');
    return response.data;
  },

  // 봉사 지원
  async apply(scheduleId: number): Promise<Application> {
    const response = await api.post<Application>(`/applications/${scheduleId}`);
    return response.data;
  },

  // 지원 취소
  async cancel(scheduleId: number): Promise<void> {
    await api.delete(`/applications/${scheduleId}`);
  },

  // 특정 일정의 지원자 목록 (관리자)
  async getApplicants(scheduleId: number): Promise<Application[]> {
    const response = await api.get<Application[]>(`/applications/schedule/${scheduleId}`);
    return response.data;
  },
};
