export const PLACE_CATEGORIES = {
  tour: {
    title: '관광지',
    contentType: '관광지',
    icon: '🏞️'
  },
  culture: {
    title: '문화시설',
    contentType: '문화시설',
    icon: '🏛️'
  },
  festival: {
    title: '축제·행사',
    contentType: '축제공연행사',
    icon: '🎉'
  },
  course: {
    title: '여행코스',
    contentType: '여행코스',
    icon: '🗺️'
  },
  reports: {
    title: '레포츠',
    contentType: '레포츠',
    icon: '🏂'
  },
  accommodation: {
    title: '숙박',
    contentType: '숙박',
    icon: '🏨'
  },
  shopping: {
    title: '쇼핑',
    contentType: '쇼핑',
    icon: '🛍️'
  },
  food: {
    title: '맛집',
    contentType: '음식점',
    icon: '🍕'
  }
};

const toCoordinate = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
};

export const normalizePlace = (place) => ({
  id: place.id,
  name: place.title,
  image: place.first_image || '',
  description: place.addr1 || `${place.region_name}의 ${place.content_type_name} 정보입니다.`,
  address: place.addr1 || '주소 정보 없음',
  latitude: toCoordinate(place.latitude),
  longitude: toCoordinate(place.longitude),
  contentType: place.content_type_name
});

export const selectRepresentativePlaces = (places, limit = 3) => {
  return [...places]
    .sort((left, right) => {
      const leftScore = Number(Boolean(left.image)) + Number(left.latitude !== null && left.longitude !== null);
      const rightScore = Number(Boolean(right.image)) + Number(right.latitude !== null && right.longitude !== null);
      return rightScore - leftScore;
    })
    .slice(0, limit);
};
