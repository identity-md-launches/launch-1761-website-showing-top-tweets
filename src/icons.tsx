export type IconName = 'compass' | 'bookmark' | 'search' | 'arrow' | 'arrowDown' | 'heart' | 'reply' | 'repost' | 'close' | 'info' | 'chevron' | 'bolt' | 'chip' | 'code' | 'users' | 'check' | 'x' | 'link';

const paths: Record<IconName, React.ReactNode> = {
  compass: <><circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z"/></>,
  bookmark: <path d="M6 4h12v17l-6-4-6 4V4Z"/>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  arrow: <><path d="M5 19 19 5M5 5h14v14"/></>,
  arrowDown: <path d="M12 4v16m-6-6 6 6 6-6"/>,
  heart: <path d="M20.5 5.5c-2.5-2.5-6-1.3-8.5 1.2C9.5 4.2 6 3 3.5 5.5s-2 6.2.5 8.7l8 7 8-7c2.5-2.5 3-6.2.5-8.7Z"/>,
  reply: <path d="M21 11a9 9 0 0 1-9 9H4l1.5-4A9 9 0 1 1 21 11Z"/>,
  repost: <><path d="m3 8 4-4 4 4M7 4v12h4m10 0-4 4-4-4m4 4V8h-4"/></>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/></>,
  chevron: <path d="m6 9 6 6 6-6"/>,
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z"/>,
  chip: <><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4M10 10h4v4h-4Z"/></>,
  code: <path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v1"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  x: <path d="m4 3 16 18h-5L4 3h5l11 18M20 3 4 21"/>,
  link: <><path d="m10 8 3-3a5 5 0 0 1 7 7l-3 3m-3 1-3 3a5 5 0 0 1-7-7l3-3m1 7 8-8"/></>,
};

export function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  return <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
