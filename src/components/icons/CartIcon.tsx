export default function CartIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 카트 프레임 */}
      <rect x="6" y="3" width="12" height="15" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />

      {/* 상단 배너/포스터 */}
      <rect x="8" y="4" width="8" height="3" rx="0.5" fill="#3B82F6" />

      {/* 출판물 선반들 */}
      <line x1="7" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1" />
      <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1" />
      <line x1="7" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="1" />

      {/* 출판물들 */}
      <rect x="8" y="9.5" width="2" height="2" rx="0.3" fill="#60A5FA" />
      <rect x="11" y="9.5" width="2" height="2" rx="0.3" fill="#34D399" />
      <rect x="14" y="9.5" width="2" height="2" rx="0.3" fill="#FBBF24" />

      <rect x="8" y="12.5" width="2" height="2" rx="0.3" fill="#F87171" />
      <rect x="11" y="12.5" width="2" height="2" rx="0.3" fill="#A78BFA" />
      <rect x="14" y="12.5" width="2" height="2" rx="0.3" fill="#60A5FA" />

      {/* 바퀴 */}
      <circle cx="9" cy="20" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="15" cy="20" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />

      {/* 바퀴 연결대 */}
      <line x1="9" y1="18" x2="9" y2="18" stroke="currentColor" strokeWidth="1.5" />
      <line x1="15" y1="18" x2="15" y2="18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
