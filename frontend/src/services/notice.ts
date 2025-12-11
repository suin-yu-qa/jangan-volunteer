import api from './api';
import type { Notice, NoticeCreateRequest, PaginatedResponse } from '../types';

export const noticeService = {
  // 공지사항 목록 조회
  async getNotices(page = 1, pageSize = 10): Promise<PaginatedResponse<Notice>> {
    const response = await api.get<PaginatedResponse<Notice>>('/notices', {
      params: { page, pageSize },
    });
    return response.data;
  },

  // 공지사항 상세 조회
  async getNotice(id: number): Promise<Notice> {
    const response = await api.get<Notice>(`/notices/${id}`);
    return response.data;
  },

  // 공지사항 생성 (관리자)
  async createNotice(data: NoticeCreateRequest): Promise<Notice> {
    const response = await api.post<Notice>('/notices', data);
    return response.data;
  },

  // 공지사항 수정 (관리자)
  async updateNotice(id: number, data: Partial<NoticeCreateRequest>): Promise<Notice> {
    const response = await api.put<Notice>(`/notices/${id}`, data);
    return response.data;
  },

  // 공지사항 삭제 (관리자)
  async deleteNotice(id: number): Promise<void> {
    await api.delete(`/notices/${id}`);
  },
};
