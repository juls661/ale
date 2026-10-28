import { useRef, useState, useSyncExternalStore } from 'react'
import type { FormEvent } from 'react'
import { PlayerController } from './player/controller'
import { nativeBridge } from './player/native'
import type { Track } from './player/model'
import { formatTime } from './player/model'
import { Icon } from './components/Icon'
import type { IconName } from './components/Icon'
import { Cover, TrackList } from './components/TrackList'
import './App.css'

type View = 'Home' | 'Search' | 'Library' | 'Local files' | 'Queue' | 'Settings'
const navigation: { name: View; icon: IconName }[] = [
  { name: 'Home', icon: 'home' },
  { name: 'Search', icon: 'search' },
  { name: 'Library', icon: 'library' },
  { name: 'Local files', icon: 'folder' },
  { name: 'Queue', icon: 'queue' },
]
function App() {
  const mac = Boolean(nativeBridge())
  const [player] = useState(() => new PlayerController())
  const state = useSyncExternalStore(player.subscribe, player.snapshot)
  const [view, setView] = useState<View>('Home')
  const [token, setToken] = useState('')
  const [term, setTerm] = useState('')
  const [results, setResults] = useState<Track[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [requestError, setRequestError] = useState('')
  const requestId = useRef(0)
  const fileInput = useRef<HTMLInputElement>(null)
  const main = useRef<HTMLElement>(null)
  const current = state.queue[state.index]
  const nativeVolume = mac && current?.source === 'apple'
  const go = (next: View) => {
    requestId.current++
    setSearching(false)
    setRequestError('')
    setResults([])
    setSearched(false)
    setView(next)
    if (next === 'Library' && state.connected) void loadLibrary()
  }
  async function loadLibrary() {
    const id = ++requestId.current
    setSearching(true)
    setResults([])
    try {
      const tracks = await player.library()
      if (id === requestId.current) setResults(tracks)
    } catch (error) {
      if (id === requestId.current)
        setRequestError(
          error instanceof Error ? error.message : 'Could not load your library. Try again.',
        )
    } finally {
      if (id === requestId.current) setSearching(false)
    }
  }
  async function search(event: FormEvent) {
    event.preventDefault()
    setView('Search')
    setRequestError('')
    const id = ++requestId.current
    if (!term.trim() || !state.connected) return
    setSearching(true)
    setSearched(true)
    setResults([])
    try {
      const tracks = await player.search(term.trim())
      if (id === requestId.current) setResults(tracks)
    } catch (error) {
      if (id === requestId.current)
        setRequestError(
          error instanceof Error
            ? error.message
            : 'Search failed. Check your connection and try again.',
        )
    } finally {
      if (id === requestId.current) setSearching(false)
    }
  }
  async function connect(event: FormEvent) {
    event.preventDefault()
    await player.connect(token)
    setToken('')
  }
  const importFiles = () => fileInput.current?.click()
  const trackList = (tracks: Track[], queue = false) => (
    <TrackList
      tracks={tracks}
      busy={state.busy}
      currentId={current?.id}
      onPlay={(track, index) => {
        void (queue ? player.playAt(index) : player.play(track))
      }}
      onAdd={queue ? undefined : player.add}
    />
  )
  const empty = (title: string, detail: string, button?: string, action?: () => void) => (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={view === 'Local files' ? 'folder' : 'music'} size={32} />
      </div>
      <h2>{title}</h2>
      <p>{detail}</p>
      {button && (
        <button className="primary-button" onClick={action}>
          {button}
          <Icon name="arrow" size={18} />
        </button>
      )}
    </div>
  )
  return (
    <div className="app-shell">
      <a className="skip-link" href="#content" onClick={() => main.current?.focus()}>
        Skip to content
      </a>
      <input
        ref={fileInput}
        className="sr-only"
        type="file"
        multiple
        accept=".mp3,.wav,.m4a,.aac,.ogg,.flac,audio/*"
        aria-label="Choose local audio files"
        tabIndex={-1}
        onChange={(event) => {
          player.importFiles(Array.from(event.target.files ?? []))
          event.target.value = ''
          go('Local files')
        }}
      />
      <aside className="sidebar" aria-label="Ale sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            ale<span className="brand-dot">.</span>
          </span>
        </div>
        <p className="sidebar-label">YOUR LISTENING SPACE</p>
        <nav aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              key={item.name}
              aria-label={item.name}
              title={item.name}
              className={`nav-item ${view === item.name ? 'selected' : ''}`}
              aria-current={view === item.name ? 'page' : undefined}
              onClick={() => go(item.name)}
            >
              <Icon name={item.icon} />
              <span>{item.name}</span>
              {item.name === 'Queue' && state.queue.length > 0 && (
                <span className="count">{state.queue.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="device-card">
            <span className="device-indicator" />
            <div>
              <strong>This computer</strong>
              <span>Audio plays here</span>
            </div>
          </div>
          <button
            className={`nav-item ${view === 'Settings' ? 'selected' : ''}`}
            aria-current={view === 'Settings' ? 'page' : undefined}
            onClick={() => go('Settings')}
          >
            <Icon name="settings" />
            Settings
          </button>
          <p className="sidebar-foot">
            A little less noise.
            <br />A little more music.
          </p>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="desktop-label">ALE / PERSONAL PLAYER</span>
          <form role="search" onSubmit={search} className="search-box">
            <Icon name="search" size={18} />
            <input
              type="search"
              aria-label="Search Apple Music"
              value={term}
              onChange={(e) => {
                setTerm(e.target.value)
                requestId.current++
                setSearching(false)
              }}
              placeholder="Search songs and artists"
              maxLength={200}
            />
            <button type="submit" aria-label="Submit search">
              <Icon name="arrow" size={17} />
            </button>
          </form>
          <button className="connection-pill" onClick={() => go('Settings')}>
            <span className={state.connected ? 'connection-dot connected' : 'connection-dot'} />
            {state.connected ? 'Apple Music connected' : 'Connect Apple Music'}
          </button>
        </header>
        <main id="content" ref={main} tabIndex={-1}>
          {(state.error || requestError) && (
            <div className="error-banner" role="alert">
              <span>{state.error || requestError}</span>
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => {
                  player.dismissError()
                  setRequestError('')
                }}
              >
                <Icon name="close" />
              </button>
            </div>
          )}
          <div className="sr-only" role="status" aria-live="polite">
            {state.notice}
            {searching ? ' Loading music.' : ''}
          </div>
          {view === 'Home' ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">SETTLE IN. PRESS PLAY.</p>
                  <h1>Your listening space</h1>
                </div>
                <span className="version-tag">
                  Made for the music <span>↗</span>
                </span>
              </div>
              <section className="hero" aria-labelledby="hero-title">
                <div className="hero-copy">
                  <span className="hero-tag">
                    <span /> IN YOUR OWN RHYTHM
                  </span>
                  <h2 id="hero-title">
                    Good music.
                    <br />
                    <em>No distractions.</em>
                  </h2>
                  <p>
                    Your favorites, your next discovery, your way.
                    <br />A fresh space for everything you love to hear.
                  </p>
                  <button className="cream-button" onClick={() => go('Settings')}>
                    Connect Apple Music
                    <Icon name="arrow" size={18} />
                  </button>
                  <span className="hero-note">Or bring your own files. Always your choice.</span>
                </div>
                <div className="record-art" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="record">
                    <div className="record-label">
                      <span>ale.</span>
                      <small>SIDE A · YOUR SOUND</small>
                      <i />
                    </div>
                  </div>
                  <span className="record-caption">LESS NOISE. MORE FEELING.</span>
                  <span className="art-spark">✳</span>
                </div>
              </section>
              <div className="section-heading">
                <h2>A good place to start</h2>
                <span>Two ways to make it yours</span>
              </div>
              <div className="start-grid">
                <section className="start-card">
                  <div className="card-icon apple-card-icon">
                    <Icon name="music" size={26} />
                  </div>
                  <div>
                    <span className="small-label">Apple Music</span>
                    <h3>Your library, in a new light.</h3>
                    <p>Connect your account to search and stream with Apple Music®.</p>
                  </div>
                  <button
                    className="round-button"
                    aria-label="Set up Apple Music"
                    onClick={() => go('Settings')}
                  >
                    <Icon name="arrow" />
                  </button>
                </section>
                <section className="start-card">
                  <div className="card-icon local-card-icon">
                    <Icon name="folder" size={26} />
                  </div>
                  <div>
                    <span className="small-label">ON THIS DEVICE</span>
                    <h3>Bring your own collection.</h3>
                    <p>Open your audio files. They stay right here on your computer.</p>
                  </div>
                  <button
                    className="round-button"
                    aria-label="Open local audio files"
                    onClick={importFiles}
                  >
                    <Icon name="plus" />
                  </button>
                </section>
              </div>
              <div className="section-heading">
                <h2>{state.local.length ? 'Recently opened' : 'Make room for your favorites'}</h2>
                <button className="text-button" onClick={() => go('Local files')}>
                  View local files <Icon name="arrow" size={16} />
                </button>
              </div>
              {state.local.length ? (
                trackList(state.local.slice(-5).reverse())
              ) : (
                <div className="quiet-card">
                  <span className="quiet-art" aria-hidden="true">
                    <Icon name="music" size={27} />
                  </span>
                  <div>
                    <strong>A collection starts with one song.</strong>
                    <p>Connect Apple Music or open a file to begin listening.</p>
                  </div>
                  <button className="secondary-button" onClick={importFiles}>
                    Open files
                  </button>
                </div>
              )}
              <p className="home-foot">
                INDEPENDENT BY DESIGN <span>•</span> INSPIRED BY THE JOY OF LISTENING
              </p>
            </>
          ) : view === 'Settings' ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">MAKE YOURSELF AT HOME</p>
                  <h1>Settings</h1>
                </div>
                <span className="version-tag">Ale 0.1.0 · Preview</span>
              </div>
              <section className="settings-card">
                <h2>Apple Music connection</h2>
                <p>
                  {mac
                    ? 'Connect through macOS and your Apple Music account in the Music app.'
                    : 'Sign in through Apple’s own window.'}{' '}
                  An active Apple Music® subscription is required for full songs. Ale never asks for
                  your Apple password.
                </p>
                {state.connected ? (
                  <div className="connected-panel">
                    <Icon name="check" />
                    <strong>Connected to Apple Music</strong>
                    <button
                      className="secondary-button"
                      disabled={state.busy}
                      onClick={() => {
                        requestId.current++
                        setResults([])
                        setSearched(false)
                        void player.disconnect()
                      }}
                    >
                      Disconnect Apple Music
                    </button>
                  </div>
                ) : mac ? (
                  <div>
                    <p>
                      macOS manages Apple Music permission. No developer token or private key is
                      entered here.
                    </p>
                    <button
                      className="primary-button"
                      disabled={state.busy}
                      onClick={() => void player.connect('')}
                    >
                      {state.busy ? 'Connecting…' : 'Connect to Apple Music'}
                      <Icon name="arrow" size={18} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={connect}>
                    <label htmlFor="developer-token">Developer token</label>
                    <textarea
                      id="developer-token"
                      rows={3}
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste your signed Apple Music developer JWT"
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      aria-describedby="token-help"
                      required
                    />
                    <p id="token-help" className="help-text">
                      Kept in memory for this session. Paste a signed token, never your .p8 private
                      key.{' '}
                      <a
                        href="https://developer.apple.com/help/account/capabilities/create-a-media-identifier-and-private-key"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Apple’s setup guide ↗
                      </a>
                    </p>
                    <button className="primary-button" disabled={state.busy} type="submit">
                      {state.busy ? 'Connecting…' : 'Connect to Apple Music'}
                      <Icon name="arrow" size={18} />
                    </button>
                  </form>
                )}
                <p className="settings-note">
                  {mac
                    ? 'Uses Apple’s native MusicKit player. Development signing and the MusicKit App Service are required; full subscription playback still needs a live account test. Apple Music volume uses the Mac’s controls.'
                    : 'Protected playback is still awaiting a real Windows test. If the embedded player cannot stream, test Ale in Microsoft Edge before continuing.'}
                </p>
              </section>
              <section className="settings-card">
                <h2>Privacy & your data</h2>
                <p>
                  Ale has no analytics, ads, or Ale account. Local files are read only after you
                  choose them, stay on this computer, and are forgotten when Ale closes. Queue and
                  preferences are session-only.
                </p>
                <p>
                  {mac
                    ? 'Connecting uses the MusicKit framework supplied by macOS. Apple receives your authorization, searches, library requests and playback activity. macOS manages account credentials and permission; Ale uses a temporary web session. Apple artwork loads from Apple’s servers.'
                    : 'Connecting downloads Apple’s MusicKit SDK. Apple receives your authorization, searches, library requests and playback activity, and may retain cookies or browser storage under its own policies. Apple artwork loads from Apple’s servers.'}
                </p>
                <div className="button-row">
                  <button
                    className="secondary-button"
                    disabled={state.busy}
                    onClick={() => {
                      requestId.current++
                      setResults([])
                      setToken('')
                      setTerm('')
                      setSearched(false)
                      void player.reset()
                    }}
                  >
                    Clear Ale data
                  </button>
                  {window.chrome?.webview && (
                    <button
                      className="secondary-button"
                      onClick={() => window.chrome?.webview?.postMessage({ type: 'clear-profile' })}
                    >
                      Clear Apple browser session & close
                    </button>
                  )}
                  <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noreferrer">
                    Apple privacy policy ↗
                  </a>
                </div>
                <p className="help-text">
                  {mac
                    ? 'Clear Ale data stops playback and removes selected files, queue and Ale web storage. It does not sign out your Mac’s Apple account or revoke MusicKit permission. To revoke access, use System Settings → Privacy & Security → Media & Apple Music.'
                    : 'Clear Ale data stops playback and removes selected files, queue and Ale origin storage. In a browser, remove this site’s data in browser settings to clear retained sign-in. In the Windows app, the browser-session button clears the complete Ale WebView2 profile and closes Ale.'}
                </p>
              </section>
              <section className="settings-card">
                <h2>Accessibility</h2>
                <p>
                  Use Tab and Shift+Tab to move between controls, Enter or Space to activate
                  buttons, and arrow keys on volume and playback sliders. Ale follows your system’s
                  reduced-motion and high-contrast preferences and supports browser zoom.
                </p>
                <p>
                  Designed toward WCAG 2.2 AA. Automated checks do not replace{' '}
                  {mac ? 'VoiceOver' : 'Windows Narrator'}, keyboard and display testing.
                </p>
              </section>
              <section className="settings-card about-card">
                <div className="small-brand">ale.</div>
                <div>
                  <h2>Independent. Made for listening.</h2>
                  <p>
                    Ale is an independent personal music player, inspired by Cider. This is original
                    software; no Cider source or assets are included. Ale is not affiliated with
                    Apple or Cider. Apple and Apple Music are trademarks of Apple Inc., registered
                    in the U.S. and other countries.
                  </p>
                  <p>
                    Use music you have the right to play. No audio downloads, DRM bypass, or
                    lossless playback claims. The iPhone remote is planned for a later milestone.
                  </p>
                </div>
              </section>
            </>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">
                    {view === 'Queue'
                      ? 'UP NEXT'
                      : view === 'Local files'
                        ? 'YOUR COLLECTION, RIGHT HERE'
                        : 'FIND YOUR NEXT FAVORITE'}
                  </p>
                  <h1>{view}</h1>
                </div>
                {view === 'Local files' ? (
                  <button className="primary-button" onClick={importFiles}>
                    <Icon name="plus" size={18} />
                    Open files
                  </button>
                ) : (
                  view === 'Queue' && (
                    <button
                      className="secondary-button"
                      disabled={state.busy || !state.queue.length}
                      onClick={() => void player.clearQueue()}
                    >
                      Clear queue
                    </button>
                  )
                )}
              </div>
              {view === 'Local files' ? (
                <>
                  <p className="page-description">
                    Audio stays on your computer. MP3, WAV, M4A, AAC, OGG and FLAC support depends
                    on your playback runtime.
                  </p>
                  {state.local.length
                    ? trackList(state.local)
                    : empty(
                        'Your collection belongs here.',
                        'Open a few audio files and let them make themselves at home.',
                        'Open audio files',
                        importFiles,
                      )}
                </>
              ) : view === 'Queue' ? (
                <>
                  <p className="page-description">
                    {state.queue.length} {state.queue.length === 1 ? 'song' : 'songs'} in your
                    queue. Plays on this computer.
                  </p>
                  {state.queue.length
                    ? trackList(state.queue, true)
                    : empty(
                        'A little quiet in here.',
                        'Play a song or add one to the queue to get things going.',
                        'Browse local files',
                        () => go('Local files'),
                      )}
                </>
              ) : !state.connected ? (
                empty(
                  'A world of music is one connection away.',
                  'Connect your Apple Music account in Settings to search songs and browse your library.',
                  'Go to Settings',
                  () => go('Settings'),
                )
              ) : searching ? (
                <p className="loading-state">Loading music…</p>
              ) : (
                <>
                  {view === 'Library' && (
                    <p className="page-description">
                      First 100 library songs; only songs available in the Apple Music catalog can
                      play in this preview.
                    </p>
                  )}
                  {results.length
                    ? trackList(results)
                    : empty(
                        view === 'Search' && !searched
                          ? 'What are you in the mood for?'
                          : 'No songs found.',
                        view === 'Search'
                          ? 'Search for a song or artist using the search field above.'
                          : 'No catalog-backed songs were found on this library page.',
                      )}
                </>
              )}
            </>
          )}
        </main>
      </div>
      <footer className="player-bar" aria-label="Playback controls">
        <div className="now-playing" data-testid="now-playing">
          <Cover track={current} />
          <div>
            <strong>{current?.title ?? 'Nothing playing'}</strong>
            <span>{current?.artist ?? 'Your next favorite is waiting.'}</span>
          </div>
        </div>
        <div className="transport">
          <div className="transport-buttons">
            <button
              className="icon-button mode-button"
              aria-label="Shuffle"
              aria-pressed={state.shuffle}
              onClick={player.toggleShuffle}
            >
              <Icon name="shuffle" size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Previous track"
              disabled={state.busy || !current}
              onClick={() => void player.previous()}
            >
              <Icon name="previous" />
            </button>
            <button
              className="play-button"
              aria-label={state.playing ? 'Pause' : 'Play'}
              disabled={state.busy || !state.queue.length}
              onClick={() => void player.toggle()}
            >
              <Icon name={state.playing ? 'pause' : 'play'} size={21} />
            </button>
            <button
              className="icon-button"
              aria-label="Next track"
              disabled={state.busy || !state.queue.length}
              onClick={() => void player.next()}
            >
              <Icon name="next" />
            </button>
            <button
              className="icon-button mode-button"
              aria-label="Repeat queue"
              aria-pressed={state.repeat}
              onClick={player.toggleRepeat}
            >
              <Icon name="repeat" size={18} />
            </button>
          </div>
          <div className="timeline">
            <span>{formatTime(state.position)}</span>
            <input
              type="range"
              aria-label="Playback position"
              aria-valuetext={`${formatTime(state.position)} of ${formatTime(state.duration)}`}
              min={0}
              max={state.duration || 0}
              step="0.1"
              value={Math.min(state.position, state.duration || 0)}
              disabled={!current || !state.duration || state.busy}
              onChange={(e) => void player.seek(Number(e.target.value))}
            />
            <span>{formatTime(state.duration)}</span>
          </div>
        </div>
        <div className="volume-control">
          <Icon name="volume" size={19} />
          <input
            type="range"
            aria-label="Volume"
            aria-valuetext={
              nativeVolume ? 'Use Mac volume controls' : `${Math.round(state.volume * 100)} percent`
            }
            aria-describedby={nativeVolume ? 'native-volume-help' : undefined}
            min={0}
            max={1}
            step="0.01"
            value={state.volume}
            disabled={nativeVolume}
            onChange={(e) => player.setVolume(Number(e.target.value))}
          />
          {nativeVolume && (
            <span id="native-volume-help" className="native-volume-note">
              Use Mac volume controls
            </span>
          )}
          <button className="icon-button" aria-label="Show queue" onClick={() => go('Queue')}>
            <Icon name="queue" />
          </button>
        </div>
      </footer>
    </div>
  )
}
export default App
