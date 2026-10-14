export const topics = [
  { id: 'all', label: 'All posts' },
  { id: 'agents', label: 'AI & agents' },
  { id: 'building', label: 'Building' },
  { id: 'community', label: 'Community' },
] as const;

export type Topic = typeof topics[number]['id'];
export type Sort = 'likes' | 'newest' | 'reposts';
export type View = 'feed' | 'saved';
export type Post = {
  id: string;
  author: string;
  handle: string;
  initials: string;
  color: string;
  text: string;
  kind: 'Post' | 'Summary';
  topic: Exclude<Topic, 'all'>;
  likes: number;
  reposts: number;
  replies: number;
  source: string;
};

export const capturedOn = '14 Oct 2026';

// Public-source snapshot. Counts are cached observations, not a live X API.
// Source provenance and selection limits are documented in artifacts/SOURCES.md.
export const posts: Post[] = [
  {
    id: '2107170024980930713', author: 'Ansem', handle: 'blknoiz06', initials: 'A', color: 'sage',
    text: 'ai16z walked so virtual could run so $imd could fly', kind: 'Post', topic: 'community',
    likes: 751, reposts: 79, replies: 86,
    source: 'https://zamantika.com/ar/blknoiz06/status/2107170024980930713',
  },
  {
    id: '2105853348188459389', author: 'Adam', handle: 'surfcoderepeat', initials: 'ad', color: 'clay',
    text: 'Adam outlines Identity MD as a distributed software factory and oracle, with the ambition of companies managed entirely by agents.',
    kind: 'Summary', topic: 'agents', likes: 352, reposts: 102, replies: 27,
    source: 'https://zamantika.com/ar/surfcoderepeat/status/2105853348188459389',
  },
  {
    id: '2108165522168987723', author: 'Tradeguru', handle: 'tradeguru', initials: 'tg', color: 'lavender',
    text: 'A deep dive into Identity MD: worker seats, agent workflows, and the applications emerging around the network.',
    kind: 'Summary', topic: 'agents', likes: 287, reposts: 65, replies: 38,
    source: 'https://zamantika.com/ar/profile/0xfinne',
  },
  {
    id: '2107659285320671390', author: 'Adam', handle: 'surfcoderepeat', initials: 'ad', color: 'clay',
    text: 'The community raised funds for a hackathon built and judged by distributed agents. The swarm also created its contract.',
    kind: 'Summary', topic: 'building', likes: 231, reposts: 31, replies: 23,
    source: 'https://zamantika.com/ar/profile/0xfinne',
  },
  {
    id: '2107515205269733852', author: 'Imran', handle: 'lmrankhan', initials: 'ik', color: 'sand',
    text: 'Imran shares that he has been exploring the IMD ecosystem and trying some of the products being built around it.',
    kind: 'Summary', topic: 'community', likes: 101, reposts: 11, replies: 6,
    source: 'https://zamantika.com/ar/profile/0xfinne',
  },
  {
    id: '2109139401448018408', author: 'Infer Protocol', handle: 'imdusd', initials: 'in', color: 'mint',
    text: 'Infer introduces imdUSD, describing an IMD-powered system where independent agents agree on prices before they are recorded onchain.',
    kind: 'Summary', topic: 'building', likes: 97, reposts: 20, replies: 4,
    source: 'https://zamantika.com/ar/profile/0xfinne',
  },
  {
    id: '2107685512463155705', author: 'Swarmbrain', handle: 'swarmbrain', initials: 'sb', color: 'mint',
    text: 'Swarmbrain introduces a public experiment comparing decisions from IMD agents with bitcoin, the S&P 500, and a coin flip.',
    kind: 'Summary', topic: 'agents', likes: 41, reposts: 5, replies: 5,
    source: 'https://zamantika.com/ar/profile/0xfinne',
  },
  {
    id: '2107136370770641362', author: 'pegzeus', handle: 'pegzeus', initials: 'pz', color: 'sage',
    text: 'imd explorer is the new producthunt', kind: 'Post', topic: 'building',
    likes: 30, reposts: 3, replies: 1,
    source: 'https://zamantika.com/ar/pegzeus/status/2107136370770641362',
  },
];

export const postUrl = (post: Post) => `https://x.com/${post.handle}/status/${post.id}`;
export const postDate = (id: string) => new Date(Number((BigInt(id) >> 22n) + 1288834974657n));
export const dateLabel = (id: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(postDate(id));
export const fullDateLabel = (id: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(postDate(id));

export function selectPosts(query: string, topic: Topic, sort: Sort, view: View, saved: string[]) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return posts.filter(post => (view !== 'saved' || saved.includes(post.id))
    && (topic === 'all' || post.topic === topic)
    && terms.every(term => `${post.text} ${post.author} @${post.handle} ${topics.find(t => t.id === post.topic)?.label}`.toLocaleLowerCase().includes(term)))
    .sort((a, b) => sort === 'newest' ? Number(BigInt(b.id) - BigInt(a.id)) : b[sort] - a[sort] || Number(BigInt(b.id) - BigInt(a.id)));
}
