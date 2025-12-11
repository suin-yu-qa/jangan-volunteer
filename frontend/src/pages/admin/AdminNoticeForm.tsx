import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { noticeService } from '../../services/notice';

export default function AdminNoticeForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isImportant: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEdit);

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (isEdit && id) {
      const loadNotice = async () => {
        try {
          const notice = await noticeService.getNotice(Number(id));
          setFormData({
            title: notice.title,
            content: notice.content,
            isImportant: notice.isImportant,
          });
        } catch (error) {
          console.error('공지사항 로드 실패:', error);
          alert('공지사항을 불러오는데 실패했습니다.');
          navigate('/admin/notices');
        } finally {
          setIsLoadingData(false);
        }
      };

      loadNotice();
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    }
    if (!formData.content.trim()) {
      newErrors.content = '내용을 입력해주세요.';
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
        content: formData.content,
        isImportant: formData.isImportant,
      };

      if (isEdit && id) {
        await noticeService.updateNotice(Number(id), data);
      } else {
        await noticeService.createNotice(data);
      }

      navigate('/admin/notices');
    } catch (error) {
      console.error('공지사항 저장 실패:', error);
      alert('공지사항 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title={isEdit ? '공지사항 수정' : '공지사항 작성'} showBack />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title={isEdit ? '공지사항 수정' : '공지사항 작성'} showBack />

      <main className="p-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
          <Input
            label="제목"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="공지사항 제목을 입력하세요"
            error={errors.title}
            required
          />

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="공지사항 내용을 입력하세요"
              rows={8}
              className={`w-full px-4 py-2.5 text-gray-900 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.content ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isImportant"
              name="isImportant"
              checked={formData.isImportant}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isImportant" className="text-sm text-gray-700">
              중요 공지사항으로 설정 (상단 고정)
            </label>
          </div>

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
