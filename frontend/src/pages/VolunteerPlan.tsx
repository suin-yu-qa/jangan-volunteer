import { useEffect, useState } from 'react';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import { applicationService } from '../services/schedule';
import type { Application } from '../types';

export default function VolunteerPlan() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const data = await applicationService.getMyApplications();
        setApplications(data);
      } catch (error) {
        console.error('지원 내역 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadApplications();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const upcomingApplications = applications.filter(
    (app) => app.status === 'applied' && app.schedule && app.schedule.date >= today
  );

  const pastApplications = applications.filter(
    (app) => app.schedule && app.schedule.date < today
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${year}.${month}.${day} (${weekday})`;
  };

  const formatTime = (time: string) => time.slice(0, 5);

  const displayedApplications = activeTab === 'upcoming' ? upcomingApplications : pastApplications;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="봉사계획" showBack />

      <main className="p-4">
        {/* 탭 */}
        <div className="flex mb-4 bg-white rounded-lg p-1">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            예정된 봉사 ({upcomingApplications.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'past'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            지난 봉사 ({pastApplications.length})
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : displayedApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>{activeTab === 'upcoming' ? '예정된 봉사가 없습니다.' : '지난 봉사 기록이 없습니다.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedApplications.map((app) => (
              <div
                key={app.id}
                className={`bg-white rounded-lg border p-4 ${
                  app.status === 'cancelled' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-primary-600 font-medium">
                      {app.schedule && formatDate(app.schedule.date)}
                    </div>
                    <h3 className="mt-1 font-semibold text-gray-900">
                      {app.schedule?.title}
                    </h3>
                    <div className="mt-1 text-sm text-gray-500">
                      {app.schedule && `${formatTime(app.schedule.startTime)} - ${formatTime(app.schedule.endTime)}`}
                    </div>
                    {app.schedule?.location && (
                      <div className="mt-1 text-sm text-gray-500">
                        {app.schedule.location}
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      app.status === 'cancelled'
                        ? 'bg-gray-100 text-gray-600'
                        : activeTab === 'past'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-primary-100 text-primary-600'
                    }`}
                  >
                    {app.status === 'cancelled' ? '취소됨' : activeTab === 'past' ? '참여완료' : '지원완료'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
