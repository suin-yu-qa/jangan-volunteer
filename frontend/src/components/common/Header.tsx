import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export default function Header({ title = '장안북부 전시대', showBack = false }: HeaderProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  return (
    <header className="safe-area-top sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-14 px-4">
        {/* 왼쪽: 뒤로가기 또는 로고 */}
        <div className="flex items-center">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <h1 className="text-lg font-bold text-primary-600">{title}</h1>
          )}
          {showBack && <span className="ml-2 text-lg font-semibold">{title}</span>}
        </div>

        {/* 오른쪽: 타임라인, 알람 아이콘 */}
        {user && (
          <div className="flex items-center gap-2">
            {/* 타임라인 버튼 */}
            <button
              onClick={() => navigate('/timeline')}
              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-full"
              title="타임라인"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* 알람 버튼 */}
            <button
              onClick={() => navigate('/notifications')}
              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-full relative"
              title="알림"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* 알림 뱃지 (새 알림이 있을 때) */}
              {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
