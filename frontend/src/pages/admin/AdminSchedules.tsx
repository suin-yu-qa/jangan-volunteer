import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { scheduleService } from '../../services/schedule';
import type { Schedule } from '../../types';

export default function AdminSchedules() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const loadSchedules = async () => {
      setIsLoading(true);
      try {
        const [year, month] = selectedMonth.split('-').map(Number);
        const data = await scheduleService.getSchedules(year, month);
        setSchedules(data);
      } catch (error) {
        console.error('일정 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedules();
  }, [selectedMonth]);

  const handleDelete = async (id: number) => {
    if (!confirm('정말 이 일정을 삭제하시겠습니까?')) return;

    try {
      await scheduleService.deleteSchedule(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error('일정 삭제 실패:', error);
      alert('일정 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${day}일 (${weekday})`;
  };

  const formatTime = (time: string) => time.slice(0, 5);

  // 날짜별로 그룹화
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.date]) {
      acc[schedule.date] = [];
    }
    acc[schedule.date].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="일정 관리" showBack />

      <main className="p-4">
        {/* 월 선택 및 추가 버튼 */}
        <div className="flex items-center justify-between mb-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border rounded-lg text-gray-900"
          />
          <Button onClick={() => navigate('/admin/schedules/new')}>
            + 일정 추가
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>등록된 일정이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSchedules)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, dateSchedules]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    {formatDate(date)}
                  </h3>
                  <div className="space-y-2">
                    {dateSchedules
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((schedule) => (
                        <div
                          key={schedule.id}
                          className="bg-white rounded-lg border p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="text-sm text-primary-600 font-medium">
                                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                              </div>
                              <h4 className="mt-1 font-semibold text-gray-900">
                                {schedule.title}
                              </h4>
                              {schedule.location && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {schedule.location}
                                </p>
                              )}
                              {schedule.applicantCount !== undefined && (
                                <p className="text-sm text-gray-400 mt-1">
                                  지원자: {schedule.applicantCount}명
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => navigate(`/admin/schedules/${schedule.id}/edit`)}
                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(schedule.id)}
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
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}
