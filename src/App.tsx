import { useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from './icons';
import { capturedOn, dateLabel, fullDateLabel, postDate, posts, postUrl, selectPosts, topics, type Post, type Sort, type Topic, type View } from './posts';

const STORAGE_KEY = 'identity-md-signal:saved:v1';
const xSearch = 'https://x.com/search?q=%22identity.md%22%20OR%20%22identitymd%22%20OR%20%24IMD&src=typed_query&f=top';
const topicIcons: Record<Topic, IconName> = { all: 'compass', agents: 'chip', building: 'code', community: 'users' };

function readLocation() {
  const [path, search = ''] = location.hash.slice(1).split('?');
  const params = new URLSearchParams(search);
  return {
    view: (path === 'saved' ? 'saved' : 'feed') as View,
    query: params.get('q') ?? '',
    topic: (topics.some(t => t.id === params.get('topic')) ? params.get('topic') : 'all') as Topic,
    sort: (['likes', 'newest', 'reposts'].includes(params.get('sort') ?? '') ? params.get('sort') : 'likes') as Sort,
  };
}

function readBookmarks() {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(data)) return [];
    return [...new Set(data.filter((id): id is string => typeof id === 'string' && posts.some(p => p.id === id)))];
  } catch { return []; }
}

function Avatar({ post, small = false }: { post: Post; small?: boolean }) {
  return <span aria-hidden="true" className={`avatar avatar-${post.color} ${small ? 'avatar-small' : ''}`}>{post.initials}</span>;
}

function PostCard({ post, saved, toggleSave }: { post: Post; saved: boolean; toggleSave: (id: string) => void }) {
  return <article className="post" aria-label={`Post by ${post.author}`}>
    <div className="post-heading">
      <a className="author-link" href={`https://x.com/${post.handle}`} target="_blank" rel="noopener noreferrer" aria-label={`${post.author}, @${post.handle} on X (opens in a new tab)`}>
        <Avatar post={post} />
        <span className="author-info"><strong>{post.author}</strong><span>@{post.handle}</span></span>
      </a>
      <time dateTime={postDate(post.id).toISOString()} title={fullDateLabel(post.id)}>{dateLabel(post.id)}</time>
      <a className="post-x" href={postUrl(post)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${post.author}’s post on X (opens in a new tab)`}><Icon name="x" size={17}/></a>
    </div>
    {post.kind === 'Summary' ? <p className="post-text">{post.text}</p> : <blockquote className="post-text">{post.text}</blockquote>}
    <div className="post-context"><span className="topic-tag">{topics.find(t => t.id === post.topic)?.label}</span>{post.kind === 'Summary' && <span className="summary-label">Post summary</span>}</div>
    <div className="post-bottom">
      <div className="post-metrics" aria-label="Captured engagement">
        <span title={`${post.replies} replies in the source snapshot`}><Icon name="reply" size={16}/><span>{post.replies}<span className="sr-only"> replies</span></span></span>
        <span title={`${post.reposts} reposts in the source snapshot`}><Icon name="repost" size={17}/><span>{post.reposts}<span className="sr-only"> reposts</span></span></span>
        <span title={`${post.likes} likes in the source snapshot`}><Icon name="heart" size={16}/><span>{post.likes}<span className="sr-only"> likes</span></span></span>
      </div>
      <div className="post-actions">
        <a className="read-post" href={postUrl(post)} target="_blank" rel="noopener noreferrer" aria-label={`Read ${post.author}’s post on X (opens in a new tab)`}>Read post<Icon name="arrow" size={14}/></a>
        <button className={`save-button ${saved ? 'is-saved' : ''}`} type="button" aria-pressed={saved} aria-label={`${saved ? 'Unsave' : 'Save'} post by ${post.author} from ${fullDateLabel(post.id)}`} onClick={() => toggleSave(post.id)} title={saved ? 'Remove from saved posts' : 'Save for later'}><Icon name="bookmark" size={18}/></button>
      </div>
    </div>
  </article>;
}

export function App() {
  const [filters, setFilters] = useState(readLocation);
  const [saved, setSaved] = useState(readBookmarks);
  const [notice, setNotice] = useState('');
  const [storageWarning, setStorageWarning] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const { view, query, topic, sort } = filters;
  const filtered = selectPosts(query, topic, sort, view, saved);

  useEffect(() => {
    const hashChange = () => { setFilters(readLocation()); setNotice(''); };
    const storageChange = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) setSaved(readBookmarks()); };
    addEventListener('hashchange', hashChange);
    addEventListener('storage', storageChange);
    return () => { removeEventListener('hashchange', hashChange); removeEventListener('storage', storageChange); };
  }, []);

  function update(patch: Partial<typeof filters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    const params = new URLSearchParams();
    if (next.query) params.set('q', next.query);
    if (next.topic !== 'all') params.set('topic', next.topic);
    if (next.sort !== 'likes') params.set('sort', next.sort);
    const hash = `#${next.view}${params.size ? `?${params}` : ''}`;
    history.replaceState(null, '', hash);
  }

  function toggleSave(id: string) {
    const next = saved.includes(id) ? saved.filter(item => item !== id) : [...saved, id];
    setSaved(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setStorageWarning(false); }
    catch { setStorageWarning(true); }
    setNotice(next.includes(id) ? 'Post saved. Find it in Saved posts.' : 'Post removed from Saved posts.');
  }

  function clearFilters() { update({ query: '', topic: 'all' }); search.current?.focus(); }

  const authors = [...new Map(posts.map(post => [post.handle, post])).values()]
    .map(post => ({ post, likes: posts.filter(p => p.handle === post.handle).reduce((total, p) => total + p.likes, 0), count: posts.filter(p => p.handle === post.handle).length }))
    .sort((a, b) => b.likes - a.likes).slice(0, 4);

  return <>
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); document.getElementById('main-content')?.scrollIntoView(); }}>Skip to content</a>
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#feed" aria-label="Identity MD Signal home"><img src="./favicon.svg" width="38" height="38" alt=""/><span>identity<span className="brand-md">.md</span><small>Signal</small></span></a>
        <nav className="main-nav" aria-label="Primary navigation">
          <a href="#feed" className={view === 'feed' ? 'active' : ''} aria-current={view === 'feed' ? 'page' : undefined}><Icon name="compass"/><span>Discover</span></a>
          <a href="#saved" className={view === 'saved' ? 'active' : ''} aria-current={view === 'saved' ? 'page' : undefined}><Icon name="bookmark"/><span>Saved posts</span><span className="nav-count">{saved.length}</span></a>
        </nav>
        <div className="sidebar-topics"><h2>Explore topics</h2>{topics.filter(t => t.id !== 'all').map(t => <button type="button" key={t.id} className={topic === t.id ? 'selected' : ''} onClick={() => { update({ topic: t.id, view: 'feed', query: '' }); document.getElementById('feed')?.scrollIntoView({ block: 'start' }); }}><Icon name={topicIcons[t.id]}/>{t.label}</button>)}</div>
        <div className="sidebar-bottom"><div className="tiny-frog" aria-hidden="true"><img src="./favicon.svg" width="26" height="26" alt=""/></div><p>Small frogs.<br/>Big intelligence.</p><button className="text-button" type="button" onClick={() => dialog.current?.showModal()}><Icon name="info" size={16}/>About this feed</button><a href="https://imd.fun" target="_blank" rel="noopener noreferrer">Visit Identity MD<Icon name="arrow" size={14}/></a></div>
      </aside>

      <main id="main-content" tabIndex={-1}>
        <header className="topbar"><span className="breadcrumb">Identity MD <span>/</span> <strong>Signal</strong></span><a className="external-link" href={xSearch} target="_blank" rel="noopener noreferrer"><Icon name="x" size={15}/>Explore on X<Icon name="arrow" size={14}/></a></header>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy"><h1 id="hero-title">The swarm,<br/><span>in focus.</span></h1><p>Top tweets from the Identity MD universe.</p><a href="#feed" className="primary-button" onClick={event => { event.preventDefault(); if (view !== 'feed') update({ view: 'feed' }); document.getElementById('feed')?.scrollIntoView({ block: 'start' }); search.current?.focus({ preventScroll: true }); }}>Explore the feed<Icon name="arrowDown" size={17}/></a></div>
          <img className="hero-art" src="./pepe-squad.webp" width="960" height="640" alt="Three Pepe operators equipped with an AI visor, microchip, laptop, and drone." fetchPriority="high"/>
        </section>

        <div className="content-grid">
          <section className="feed-section" id="feed" aria-labelledby="feed-title">
            <div className="feed-heading"><h2 id="feed-title">{view === 'saved' ? 'Saved posts' : 'Top tweets'} <span>{view === 'saved' ? saved.length : posts.length}</span></h2><button type="button" className="snapshot-button" onClick={() => dialog.current?.showModal()}><span className="snapshot-dot"/>{view === 'saved' ? 'On this browser' : 'Snapshot'}<Icon name="info" size={14}/></button></div>
            <div className="feed-toolbar">
              <label className="search-field"><Icon name="search" size={18}/><span className="sr-only">Search posts</span><input ref={search} type="search" name="search" value={query} onChange={event => update({ query: event.target.value })} placeholder="Search posts or people" autoComplete="off"/>{query && <button type="button" className="clear-search" onClick={() => { update({ query: '' }); search.current?.focus(); }} aria-label="Clear search"><Icon name="close" size={16}/></button>}</label>
              <label className="sort-field"><span className="sr-only">Sort posts</span><select value={sort} onChange={event => update({ sort: event.target.value as Sort })}><option value="likes">Most liked</option><option value="newest">Newest</option><option value="reposts">Most reposted</option></select><Icon name="chevron" size={15}/></label>
            </div>
            <div className="topic-filters" role="group" aria-label="Filter by topic">{topics.map(t => <button type="button" key={t.id} aria-pressed={topic === t.id} className={topic === t.id ? 'active' : ''} onClick={() => update({ topic: t.id })}>{t.label}</button>)}</div>
            <div className="feed-meta"><span role="status">{filtered.length} {filtered.length === 1 ? 'post' : 'posts'}{query || topic !== 'all' ? ' found' : ' in this collection'}</span>{query || topic !== 'all' ? <button type="button" onClick={clearFilters}>Clear filters<Icon name="close" size={12}/></button> : <span>{capturedOn}</span>}</div>
            {storageWarning && <div className="storage-warning" role="alert">Browser storage is unavailable. Saved posts will last until you close or reload this page.</div>}
            <div className="sr-only" role="status">{notice}</div>
            <div className="post-list">{filtered.map(post => <PostCard key={post.id} post={post} saved={saved.includes(post.id)} toggleSave={toggleSave}/>)}</div>
            {filtered.length === 0 && <div className="empty-state"><Icon name={view === 'saved' && !saved.length ? 'bookmark' : 'search'} size={32}/><h3>{view === 'saved' && !saved.length ? 'Keep the good ones.' : 'No posts found'}</h3><p>{view === 'saved' && !saved.length ? 'Use the bookmark on any post to save it here.' : query ? `No posts match “${query}”${topic !== 'all' ? ' in this topic' : ''}. Try a name or another keyword.` : 'There are no saved posts in this topic yet.'}</p>{view === 'saved' && !saved.length ? <a className="primary-button" href="#feed">Explore posts<Icon name="arrow" size={16}/></a> : <button className="primary-button" type="button" onClick={clearFilters}>Clear filters</button>}</div>}
            {filtered.length > 0 && <div className="feed-end"><span className="end-line"/><Icon name="check" size={16}/><span>You’re all caught up</span><span className="end-line"/></div>}
            <footer className="feed-footer"><span>A snapshot of the conversation, not a live feed.</span><button type="button" onClick={() => dialog.current?.showModal()}>How posts are selected<Icon name="arrow" size={13}/></button></footer>
          </section>

          <aside className="right-rail" aria-label="Explore the collection">
            <section className="rail-section"><h2>In the conversation<Icon name="users" size={18}/></h2><p className="section-hint">Voices in this collection</p><div className="people-list">{authors.map(({ post, count }) => <button type="button" className="person" key={post.handle} onClick={() => { update({ query: `@${post.handle}`, topic: 'all', view: 'feed' }); search.current?.focus(); }}><Avatar post={post} small/><span><strong>{post.author}</strong><small>{count} {count === 1 ? 'post' : 'posts'}</small></span><Icon name="arrow" size={14}/></button>)}</div></section>
            <section className="rail-section topics-section"><h2>Follow a thread<Icon name="bolt" size={18}/></h2><div className="topic-list">{topics.filter(t => t.id !== 'all').map((t, i) => <button type="button" key={t.id} onClick={() => update({ topic: t.id, query: '', view: 'feed' })}><span className="topic-number">0{i + 1}</span><span><strong>{t.label}</strong><small>{posts.filter(post => post.topic === t.id).length} posts</small></span><Icon name="arrow" size={15}/></button>)}</div></section>
            <section className="about-card"><Icon name="chip" size={24}/><h2>Frogs with an unfair advantage.</h2><p>A little AI. A lot of curiosity. Your window into what the Identity MD community is building.</p><a href="https://explorer.imd.fun" target="_blank" rel="noopener noreferrer">Meet the swarm<Icon name="arrow" size={15}/></a></section>
            <div className="rail-footer"><span>Built for the curious.</span><button type="button" onClick={() => dialog.current?.showModal()}>Sources & details<Icon name="arrow" size={13}/></button></div>
          </aside>
        </div>
      </main>
    </div>

    <dialog ref={dialog} className="about-dialog" aria-labelledby="about-title" onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button, a[href], summary')].filter(el => el.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }} onClick={event => { if (event.target === dialog.current) { const r = dialog.current.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.current.close(); } }}>
      <div className="dialog-heading"><h2 id="about-title">About this feed</h2><button className="icon-button" type="button" onClick={() => dialog.current?.close()} aria-label="Close about this feed" autoFocus><Icon name="close"/></button></div>
      <p>Signal is an independent collection of tweets about Identity MD, with a squad of AI-equipped Pepes keeping watch.</p>
      <h3>A small, sourced snapshot</h3><p>These {posts.length} selected posts were gathered from public, cached tweet pages on {capturedOn}. “Most liked” ranks this collection by captured likes. It is not an exhaustive ranking of X, and counts do not update automatically.</p>
      <h3>Original voices, clear context</h3><p>Short posts retain their wording. Longer posts are condensed and marked “Post summary.” Summaries describe the author’s claims, without independently verifying them. “Read post” opens the original on X, which may require sign-in.</p>
      <h3>Saved on your browser</h3><p>Bookmarks stay in this browser’s local storage. They do not like or bookmark posts on X, and do not sync to other devices.</p>
      <details><summary>View the source list <span>{posts.length}</span></summary><ul className="source-list">{posts.map(post => <li key={post.id}><a href={post.source} target="_blank" rel="noopener noreferrer">@{post.handle} · {dateLabel(post.id)}<Icon name="arrow" size={14}/></a></li>)}</ul><p className="source-note">Public mirrors can show older counts or become unavailable. Post dates are decoded from X post IDs. Avatars are initials, not profile images.</p></details>
    </dialog>
  </>;
}
