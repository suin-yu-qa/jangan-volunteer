import { useEffect } from 'react';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import Calendar from '../components/calendar/Calendar';
import TimeSlotList from '../components/calendar/TimeSlotList';
import { useScheduleStore } from '../stores/scheduleStore';
import { scheduleService, applicationService } from '../services/schedule';

export default function Home() {
  const { selectedDate, setSchedules, setSelectedDate, setMyApplications, setLoading, isLoading } = useScheduleStore();

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;

        // 일정과 내 지원 내역 동시 로드
        const [schedules, applications] = await Promise.all([
          scheduleService.getSchedules(year, month),
          applicationService.getMyApplications(),
        ]);

        setSchedules(schedules);
        setMyApplications(applications);
        setSelectedDate(selectedDate); // 선택된 날짜의 일정 필터링
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate.getMonth(), selectedDate.getFullYear()]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />

      <main className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            <Calendar />
            <TimeSlotList />
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
