import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import { noticeService } from '../services/notice';
import type { Notice } from '../types';

export default function NoticePage() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNotices = async () => {
      try {
        const data = await noticeService.getNotices();
        setNotices(data.items);
      } catch (error) {
        console.error('공지사항 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotices();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 중요 공지를 상단에 정렬
  const sortedNotices = [...notices].sort((a, b) => {
    if (a.isImportant && !b.isImportant) return -1;
    if (!a.isImportant && b.isImportant) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="공지사항" showBack />

      <main className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <p>등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotices.map((notice) => (
              <button
                key={notice.id}
                onClick={() => navigate(`/notice/${notice.id}`)}
                className="w-full bg-white rounded-lg border p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-2">
                  {notice.isImportant && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded">
                      중요
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {notice.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {notice.content}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {formatDate(notice.createdAt)}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
