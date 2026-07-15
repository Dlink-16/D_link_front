const STORAGE_KEY = 'localhubPosts';

const DEFAULT_POSTS = [
  {
    id: 10,
    title: '태평소국밥 국밥 메뉴 추천',
    content: '내장탕이랑 육사시미는 필수 주문 조합입니다. 평일 저녁에도 웨이팅이 조금 있을 수 있으니 참고하세요!',
    password: '1234',
    created_at: '2026.07.14',
    created_at_full: '2026-07-14 09:30:00'
  },
  {
    id: 9,
    title: '수통골 등산 코스 난이도 정리',
    content: '수통골은 초보도 충분히 도전 가능하지만, 날씨와 체력에 따라 난이도가 달라집니다.',
    password: '1234',
    created_at: '2026.07.14',
    created_at_full: '2026-07-14 08:45:00'
  },
  {
    id: 8,
    title: '갑천변 자전거 도로 공사 끝났나요?',
    content: '최근 공사 소식이 있던 구간이 있어서 궁금합니다. 경험 있으신 분 알려주세요.',
    password: '1234',
    created_at: '2026.07.13',
    created_at_full: '2026-07-13 20:10:00'
  },
  {
    id: 7,
    title: '대전 한빛탑 야경 사진 공유합니다',
    content: '저녁에 한빛탑 주변을 걷다 찍은 사진입니다. 분위기가 정말 좋더라고요.',
    password: '1234',
    created_at: '2026.07.12',
    created_at_full: '2026-07-12 19:20:00'
  },
  {
    id: 6,
    title: '청주 성안길 맛집 추천 부탁드려요',
    content: '이번 주말에 가볼 예정인데, 혼밥하기 좋은 곳 있으면 알려주세요.',
    password: '1234',
    created_at: '2026.07.11',
    created_at_full: '2026-07-11 18:00:00'
  },
  {
    id: 5,
    title: '대청호에서 자전거 타기 좋은 시간대가 있나요?',
    content: '아침이나 저녁이 더 좋다고 들었는데 실제로 어떤가요?',
    password: '1234',
    created_at: '2026.07.10',
    created_at_full: '2026-07-10 17:15:00'
  }
];

const normalizeCreatedAtValue = (value) => {
  if (!value) {
    return '';
  }

  let normalized = String(value).trim();

  if (!normalized) {
    return '';
  }

  if (normalized.includes('.')) {
    normalized = normalized.replace(/\./g, '-');
  }

  if (normalized.includes('T')) {
    normalized = normalized.replace('T', ' ');
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return `${normalized} 00:00:00`;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
    return normalized;
  }

  return normalized;
};

const normalizePost = (post) => {
  if (!post || typeof post !== 'object') {
    return post;
  }

  return {
    ...post,
    created_at_full: normalizeCreatedAtValue(post.created_at_full || post.created_at)
  };
};

const formatLocalDateTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  return null;
};

const readStoredPosts = () => {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('게시글 저장소 읽기 실패:', error);
    return [];
  }
};

export const seedDefaultPosts = () => {
  const storage = getStorage();

  if (storage) {
    const existingPosts = storage.getItem(STORAGE_KEY);

    if (!existingPosts) {
      storage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_POSTS.map(normalizePost)));
    } else {
      const parsedPosts = JSON.parse(existingPosts);
      if (Array.isArray(parsedPosts) && parsedPosts.length < DEFAULT_POSTS.length) {
        const mergedPosts = [...DEFAULT_POSTS.map(normalizePost), ...parsedPosts.filter((post) => !DEFAULT_POSTS.some((defaultPost) => defaultPost.id === post.id)).map(normalizePost)];
        storage.setItem(STORAGE_KEY, JSON.stringify(mergedPosts.map(normalizePost)));
      } else if (Array.isArray(parsedPosts)) {
        storage.setItem(STORAGE_KEY, JSON.stringify(parsedPosts.map(normalizePost)));
      }
    }
  }

  return getPosts();
};

export const getPosts = () => {
  const storedPosts = readStoredPosts();

  if (storedPosts.length > 0) {
    return storedPosts.map(normalizePost);
  }

  return seedDefaultPosts();
};

export const savePosts = (posts) => {
  const storage = getStorage();
  const nextPosts = Array.isArray(posts) ? posts : [];

  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(nextPosts));
  }

  return nextPosts;
};

export const addPost = (postData) => {
  const now = new Date();
  const newPost = {
    id: Date.now(),
    title: postData.title,
    content: postData.content,
    password: postData.password,
    created_at: now.toLocaleDateString('sv-SE'),
    created_at_full: formatLocalDateTime(now)
  };

  const nextPosts = [newPost, ...getPosts()];
  return savePosts(nextPosts);
};

export const updatePostById = (id, postData) => {
  const posts = getPosts();
  const nextPosts = posts.map((post) => {
    if (String(post.id) !== String(id)) {
      return post;
    }

    return {
      ...post,
      title: postData.title,
      content: postData.content,
      password: postData.password,
      created_at: post.created_at,
      created_at_full: post.created_at_full
    };
  });

  return savePosts(nextPosts);
};

export const getPostById = (id) => {
  return getPosts().find((post) => String(post.id) === String(id));
};

export const deletePostById = (id) => {
  const nextPosts = getPosts().filter((post) => String(post.id) !== String(id));
  return savePosts(nextPosts);
};
