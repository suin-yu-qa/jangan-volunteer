import { useEffect, useState } from 'react';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import { applicationService } from '../services/schedule';
import type { Application } from '../types';

export default function Timeline() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const data = await applicationService.getMyApplications();
        // 날짜순으로 정렬 (최신순)
        const sorted = data.sort((a, b) => {
          const dateA = a.schedule?.date || '';
          const dateB = b.schedule?.date || '';
          return dateB.localeCompare(dateA);
        });
        setApplications(sorted);
      } catch (error) {
        console.error('타임라인 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadApplications();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일`;
  };

  const formatTime = (time: string) => time.slice(0, 5);

  const today = new Date().toISOString().split('T')[0];

  // 날짜별로 그룹화
  const groupedByDate = applications.reduce((acc, app) => {
    const date = app.schedule?.date || 'unknown';
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(app);
    return acc;
  }, {} as Record<string, Application[]>);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="타임라인" showBack />

      <main className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>봉사 활동 기록이 없습니다.</p>
          </div>
        ) : (
          <div className="relative">
            {/* 타임라인 선 */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="space-y-6">
              {Object.entries(groupedByDate).map(([date, apps]) => (
                <div key={date} className="relative pl-10">
                  {/* 타임라인 점 */}
                  <div className={`absolute left-2.5 w-3 h-3 rounded-full ${
                    date >= today ? 'bg-primary-500' : 'bg-gray-400'
                  }`}></div>

                  {/* 날짜 헤더 */}
                  <div className="mb-2">
                    <span className={`text-sm font-medium ${
                      date >= today ? 'text-primary-600' : 'text-gray-500'
                    }`}>
                      {formatDate(date)}
                      {date === today && (
                        <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-600 text-xs rounded">
                          오늘
                        </span>
                      )}
                    </span>
                  </div>

                  {/* 해당 날짜의 봉사 목록 */}
                  <div className="space-y-2">
                    {apps.map((app) => (
                      <div
                        key={app.id}
                        className={`bg-white rounded-lg border p-3 ${
                          app.status === 'cancelled' ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {app.schedule?.title}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {app.schedule && `${formatTime(app.schedule.startTime)} - ${formatTime(app.schedule.endTime)}`}
                            </p>
                            {app.schedule?.location && (
                              <p className="text-xs text-gray-400 mt-1">
                                {app.schedule.location}
                              </p>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            app.status === 'cancelled'
                              ? 'bg-gray-100 text-gray-600'
                              : date < today
                              ? 'bg-green-100 text-green-600'
                              : 'bg-primary-100 text-primary-600'
                          }`}>
                            {app.status === 'cancelled'
                              ? '취소'
                              : date < today
                              ? '완료'
                              : '예정'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
