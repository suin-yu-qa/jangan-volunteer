import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { noticeService } from '../../services/notice';
import type { Notice } from '../../types';

export default function AdminNotices() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNotices = async () => {
      try {
        const data = await noticeService.getNotices(1, 100);
        setNotices(data.items);
      } catch (error) {
        console.error('공지사항 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotices();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('정말 이 공지사항을 삭제하시겠습니까?')) return;

    try {
      await noticeService.deleteNotice(id);
      setNotices((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
      alert('공지사항 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="공지사항 관리" showBack />

      <main className="p-4">
        {/* 추가 버튼 */}
        <div className="flex justify-end mb-4">
          <Button onClick={() => navigate('/admin/notices/new')}>
            + 공지 작성
          </Button>
        </div>

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
            {notices.map((notice) => (
              <div key={notice.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {notice.isImportant && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded">
                          중요
                        </span>
                      )}
                      <h4 className="font-semibold text-gray-900 truncate">
                        {notice.title}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {notice.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(notice.createdAt)}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => navigate(`/admin/notices/${notice.id}/edit`)}
                      className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(notice.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
