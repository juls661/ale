import type { Track } from '../player/model'
import { formatTime } from '../player/model'
import { Icon } from './Icon'
export function Cover({ track, large = false }: { track?: Track; large?: boolean }) {
  return (
    <div className={`cover ${large ? 'cover-large' : ''}`}>
      {track?.artwork ? (
        <img src={track.artwork} alt="" loading="lazy" />
      ) : (
        <Icon name="music" size={large ? 56 : 22} />
      )}
    </div>
  )
}
export function TrackList({
  tracks,
  onPlay,
  onAdd,
  busy,
  currentId,
}: {
  tracks: Track[]
  onPlay: (track: Track, index: number) => void
  onAdd?: (track: Track) => void
  busy: boolean
  currentId?: string
}) {
  return (
    <ol className="track-list">
      {tracks.map((track, index) => (
        <li
          key={`${track.source}-${track.id}-${index}`}
          className={track.id === currentId ? 'track active-track' : 'track'}
        >
          <span className="track-number">{String(index + 1).padStart(2, '0')}</span>
          <Cover track={track} />
          <button
            className="track-name"
            disabled={busy}
            onClick={() => onPlay(track, index)}
            aria-label={`Play ${track.title}`}
          >
            <strong>{track.title}</strong>
            <span>
              {track.artist}
              {track.album && ` · ${track.album}`}
            </span>
          </button>
          <span className="duration">{track.duration ? formatTime(track.duration) : '—'}</span>
          {track.appleUrl && (
            <a className="apple-link" href={track.appleUrl} target="_blank" rel="noreferrer">
              Apple Music <span className="sr-only">for {track.title}</span> ↗
            </a>
          )}
          {onAdd && (
            <button
              className="icon-button"
              aria-label={`Add ${track.title} to queue`}
              disabled={busy}
              onClick={() => onAdd(track)}
            >
              <Icon name="plus" />
            </button>
          )}
        </li>
      ))}
    </ol>
  )
}
