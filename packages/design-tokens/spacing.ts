/** Crumi 디자인 시스템 — 간격 및 레이아웃 토큰 */

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  full: '9999px',
} as const;

/** UI 컴포넌트별 기본 radius */
export const componentRadius = {
  card: borderRadius.xl, // 16px
  button: borderRadius.lg, // 12px
  input: borderRadius.md, // 8px
  badge: borderRadius.full, // pill
  avatar: borderRadius.full, // circle
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const sidebarWidth = {
  collapsed: '64px',
  expanded: '256px',
} as const;
