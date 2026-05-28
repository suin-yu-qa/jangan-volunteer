/**
 * ============================================================================
 * 공개봉사 아이콘 컴포넌트 (컨셉 H: 프레임 + 두 사람)
 * ============================================================================
 *
 * 세로 프레임(포스터·문) 안에 두 명의 봉사자가 함께 서 있는 모습.
 * 오른쪽에 살짝 열린 문/깊이 표식으로 "공개적 접촉" 의미를 더함.
 * 단색 라인아트로 정제 — 사진 같은 사실감 대신 기호로 다듬음.
 *
 * 사용처:
 * - 서비스 선택 페이지의 공개봉사 카드
 * - 통합 운영 일정의 그룹 헤더 아이콘
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
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 메인 프레임 */}
      <rect x="10" y="8" width="36" height="48" rx="1.5"
            stroke="currentColor" strokeWidth="2.5" />

      {/* 오른쪽 깊이/문 표식 */}
      <path d="M50 12 L54 12 L54 52 L50 52"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinejoin="round" strokeLinecap="round" />

      {/* 왼쪽 사람 */}
      <circle cx="22" cy="20" r="3.2" stroke="currentColor" strokeWidth="2" />
      <line x1="22" y1="23.5" x2="22" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="27" x2="29" y2="29" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="27" x2="19" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="38" x2="20" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="38" x2="24" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      {/* 오른쪽 사람 */}
      <circle cx="33" cy="20" r="3.2" stroke="currentColor" strokeWidth="2" />
      <line x1="33" y1="23.5" x2="33" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="33" y1="27" x2="30" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="33" y1="27" x2="36" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="33" y1="38" x2="31" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="33" y1="38" x2="35" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
