import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { scheduleService } from '../../services/schedule';

export default function AdminScheduleForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEdit);

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (isEdit && id) {
      const loadSchedule = async () => {
        try {
          const schedule = await scheduleService.getSchedule(Number(id));
          setFormData({
            title: schedule.title,
            description: schedule.description || '',
            date: schedule.date,
            startTime: schedule.startTime.slice(0, 5),
            endTime: schedule.endTime.slice(0, 5),
            location: schedule.location || '',
          });
        } catch (error) {
          console.error('일정 로드 실패:', error);
          alert('일정을 불러오는데 실패했습니다.');
          navigate('/admin/schedules');
        } finally {
          setIsLoadingData(false);
        }
      };

      loadSchedule();
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    }
    if (!formData.date) {
      newErrors.date = '날짜를 선택해주세요.';
    }
    if (!formData.startTime) {
      newErrors.startTime = '시작 시간을 선택해주세요.';
    }
    if (!formData.endTime) {
      newErrors.endTime = '종료 시간을 선택해주세요.';
    }
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = '종료 시간은 시작 시간 이후여야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      const data = {
        title: formData.title,
        description: formData.description || undefined,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location || undefined,
      };

      if (isEdit && id) {
        await scheduleService.updateSchedule(Number(id), data);
      } else {
        await scheduleService.createSchedule(data);
      }

      navigate('/admin/schedules');
    } catch (error) {
      console.error('일정 저장 실패:', error);
      alert('일정 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title={isEdit ? '일정 수정' : '일정 추가'} showBack />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title={isEdit ? '일정 수정' : '일정 추가'} showBack />

      <main className="p-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
          <Input
            label="제목"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="봉사 일정 제목을 입력하세요"
            error={errors.title}
            required
          />

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">설명</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="봉사 일정에 대한 설명을 입력하세요 (선택)"
              rows={3}
              className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <Input
            label="날짜"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            error={errors.date}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="시작 시간"
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              error={errors.startTime}
              required
            />
            <Input
              label="종료 시간"
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              error={errors.endTime}
              required
            />
          </div>

          <Input
            label="장소"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="봉사 장소를 입력하세요 (선택)"
          />

          <div className="pt-4">
            <Button type="submit" fullWidth loading={isLoading}>
              {isEdit ? '수정하기' : '등록하기'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
