export type IconName =
  | 'home'
  | 'search'
  | 'library'
  | 'folder'
  | 'queue'
  | 'settings'
  | 'play'
  | 'pause'
  | 'next'
  | 'previous'
  | 'shuffle'
  | 'repeat'
  | 'volume'
  | 'plus'
  | 'arrow'
  | 'close'
  | 'music'
  | 'check'
const paths: Record<IconName, string> = {
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  library: 'M4 3v18M9 3v18m5-17 5-1 3 17-5 1Z',
  folder: 'M3 6h7l2 3h9v11H3ZM3 6V4h7l2 2h9v3',
  queue: 'M3 6h18M3 12h12M3 18h9m5-3 5 3-5 3Z',
  settings:
    'm9 3 6 0 1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Zm6 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  play: 'm8 4 13 8-13 8Z',
  pause: 'M7 4v16M17 4v16',
  next: 'm4 5 11 7-11 7ZM19 5v14',
  previous: 'm20 5-11 7 11 7ZM5 5v14',
  shuffle: 'M3 6h3c6 0 6 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 4-2 6-6s4-6 6-6h3m-4-4 4 4-4 4',
  repeat: 'm17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14-1v3a2 2 0 0 1-2 2H3',
  volume: 'M3 9h4l5-5v16l-5-5H3Zm13-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  plus: 'M12 5v14M5 12h14',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  close: 'm6 6 12 12M6 18 18 6',
  music:
    'M9 18V5l12-3v13M9 9l12-3M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3m12-3a3 3 0 1 1-3-3 3 3 0 0 1 3 3',
  check: 'm4 12 5 5L20 6',
}
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
