/**
 * ============================================================================
 * 공개봉사 아이콘 컴포넌트 (컨셉 E: 책 + 파동)
 * ============================================================================
 *
 * 중앙의 작은 펼친 책(말씀)에서 동심원 3겹이 옅음→짙음으로 퍼지는 형태.
 * 한 사람의 말이 공공으로 확산되는 모티프. 단색·기하학적·여백 풍부.
 *
 * 사용처:
 * - 서비스 선택 페이지의 봉사 신청 카드 (소형 아이콘)
 *
 * Props:
 * - className: 아이콘 크기 및 색상 (기본값: "w-6 h-6")
 *   text-* 클래스로 색상 지정 (예: "text-blue-600")
 * ============================================================================
 */

export default function PublicVolunteerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 동심원 파동 — 메시지가 외부로 확산되는 잔향 */}
      <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="1" opacity="0.10" />
      <circle cx="60" cy="60" r="42" stroke="currentColor" strokeWidth="1.3" opacity="0.22" />
      <circle cx="60" cy="60" r="30" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />

      {/* 중심: 펼친 책 (좌측 페이지) */}
      <path
        d="M42 53.5 Q42 49 47 49 L58.5 49 Q60 49 60 50.5 L60 69.5 Q60 71 58.5 71 L47 71 Q42 71 42 66.5 Z"
        fill="white"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* 중심: 펼친 책 (우측 페이지) */}
      <path
        d="M78 53.5 Q78 49 73 49 L61.5 49 Q60 49 60 50.5 L60 69.5 Q60 71 61.5 71 L73 71 Q78 71 78 66.5 Z"
        fill="white"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* 페이지 텍스트 라인 (좌) */}
      <line x1="46" y1="55" x2="57" y2="55" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
      <line x1="46" y1="59.5" x2="57" y2="59.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
      <line x1="46" y1="64" x2="55" y2="64" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />

      {/* 페이지 텍스트 라인 (우) */}
      <line x1="63" y1="55" x2="74" y2="55" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
      <line x1="63" y1="59.5" x2="74" y2="59.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
      <line x1="65" y1="64" x2="74" y2="64" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
    </svg>
  )
}
