import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import { noticeService } from '../services/notice';
import type { Notice } from '../types';

export default function NoticeDetail() {
  const { id } = useParams<{ id: string }>();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNotice = async () => {
      if (!id) return;
      try {
        const data = await noticeService.getNotice(Number(id));
        setNotice(data);
      } catch (error) {
        console.error('공지사항 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotice();
  }, [id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="공지사항" showBack />

      <main className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : notice ? (
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-start gap-2 mb-4">
              {notice.isImportant && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded">
                  중요
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{notice.title}</h1>
            <p className="mt-2 text-sm text-gray-500">{formatDate(notice.createdAt)}</p>

            <hr className="my-4" />

            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-gray-700">{notice.content}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>공지사항을 찾을 수 없습니다.</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
