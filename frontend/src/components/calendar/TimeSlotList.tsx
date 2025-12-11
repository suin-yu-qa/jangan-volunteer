import { useState } from 'react';
import { useScheduleStore } from '../../stores/scheduleStore';
import { applicationService } from '../../services/schedule';
import Button from '../common/Button';
import type { Schedule } from '../../types';

interface TimeSlotProps {
  schedule: Schedule;
  onApply: (scheduleId: number) => void;
  onCancel: (scheduleId: number) => void;
  isLoading: boolean;
}

function TimeSlot({ schedule, onApply, onCancel, isLoading }: TimeSlotProps) {
  const formatTime = (time: string) => {
    return time.slice(0, 5); // "HH:mm:ss" -> "HH:mm"
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary-600">
            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
          </span>
          {schedule.applicantCount !== undefined && (
            <span className="text-xs text-gray-500">
              ({schedule.applicantCount}명 지원)
            </span>
          )}
        </div>
        <h4 className="mt-1 font-semibold text-gray-900">{schedule.title}</h4>
        {schedule.location && (
          <p className="mt-1 text-sm text-gray-500">
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {schedule.location}
            </span>
          </p>
        )}
        {schedule.description && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{schedule.description}</p>
        )}
      </div>
      <div className="ml-4">
        {schedule.isApplied ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(schedule.id)}
            loading={isLoading}
          >
            취소하기
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onApply(schedule.id)}
            loading={isLoading}
          >
            지원하기
          </Button>
        )}
      </div>
    </div>
  );
}

export default function TimeSlotList() {
  const { selectedDate, selectedSchedules, addApplication, removeApplication } = useScheduleStore();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${year}년 ${month}월 ${day}일 (${weekday})`;
  };

  const handleApply = async (scheduleId: number) => {
    setLoadingId(scheduleId);
    try {
      const application = await applicationService.apply(scheduleId);
      addApplication(application);
    } catch (error) {
      console.error('지원 실패:', error);
      alert('지원에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancel = async (scheduleId: number) => {
    if (!confirm('정말 지원을 취소하시겠습니까?')) return;

    setLoadingId(scheduleId);
    try {
      await applicationService.cancel(scheduleId);
      removeApplication(scheduleId);
    } catch (error) {
      console.error('취소 실패:', error);
      alert('취소에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="mt-4">
      <h3 className="mb-3 text-lg font-semibold text-gray-900">
        {formatDate(selectedDate)}
      </h3>

      {selectedSchedules.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-gray-500">등록된 봉사 일정이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedSchedules
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((schedule) => (
              <TimeSlot
                key={schedule.id}
                schedule={schedule}
                onApply={handleApply}
                onCancel={handleCancel}
                isLoading={loadingId === schedule.id}
              />
            ))}
        </div>
      )}
    </div>
  );
}
