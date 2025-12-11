import { useEffect, useState } from 'react';
import Header from '../../components/common/Header';
import api from '../../services/api';
import type { User } from '../../types';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await api.get<User[]>('/admin/users');
        setUsers(response.data);
      } catch (error) {
        console.error('사용자 목록 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: 'admin' | 'user') => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const action = newRole === 'admin' ? '관리자로 변경' : '일반 사용자로 변경';
    if (!confirm(`${user.name}님을 ${action}하시겠습니까?`)) return;

    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (error) {
      console.error('역할 변경 실패:', error);
      alert('역할 변경에 실패했습니다.');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="사용자 관리" showBack />

      <main className="p-4">
        {/* 검색 */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름 또는 이메일로 검색"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 사용자 수 */}
        <p className="mb-3 text-sm text-gray-500">
          총 {filteredUsers.length}명의 사용자
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-gray-600">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{user.name}</h4>
                        {user.role === 'admin' && (
                          <span className="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs font-medium rounded">
                            관리자
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        가입일: {formatDate(user.createdAt)}
                        {user.provider !== 'email' && ` · ${user.provider}`}
                      </p>
                    </div>
                  </div>

                  {/* 역할 변경 버튼 */}
                  <div>
                    {user.role === 'admin' ? (
                      <button
                        onClick={() => handleRoleChange(user.id, 'user')}
                        className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        관리자 해제
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRoleChange(user.id, 'admin')}
                        className="px-3 py-1.5 text-xs text-primary-600 border border-primary-300 rounded hover:bg-primary-50"
                      >
                        관리자 지정
                      </button>
                    )}
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
