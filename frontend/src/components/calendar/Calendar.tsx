import ReactCalendar from 'react-calendar';
import { useScheduleStore } from '../../stores/scheduleStore';
import 'react-calendar/dist/Calendar.css';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function Calendar() {
  const { selectedDate, setSelectedDate, appliedDates } = useScheduleStore();

  const handleDateChange = (value: Value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  // 날짜에 빨간색 점 표시 (지원한 날짜)
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      if (appliedDates.includes(dateStr)) {
        return (
          <div className="flex justify-center mt-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
        );
      }
    }
    return null;
  };

  // 날짜 타일 클래스
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      if (appliedDates.includes(dateStr)) {
        return 'has-application';
      }
    }
    return '';
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-4">
      <ReactCalendar
        onChange={handleDateChange}
        value={selectedDate}
        tileContent={tileContent}
        tileClassName={tileClassName}
        locale="ko-KR"
        calendarType="gregory"
        formatDay={(_, date) => date.getDate().toString()}
        minDetail="month"
        next2Label={null}
        prev2Label={null}
        showNeighboringMonth={false}
      />
    </div>
  );
}
