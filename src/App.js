import React, { useState, useEffect, useRef, useCallback } from 'react';
import Masonry from 'react-masonry-css';
import axios from 'axios';

// 상단에서 환경 변수 확인용 로그 추가
console.log('Environment Variables:', {
  pixabay: process.env.REACT_APP_PIXABAY_KEY,
  giphy: process.env.REACT_APP_GIPHY_KEY,
  flickr: process.env.REACT_APP_FLICKR_KEY
});

// 임시 API 키 객체
const API_KEYS = {
  pixabay: '41632995-e7a8f3c2d4c6f5f4c6f2e9e9',
  giphy: 'GltzP4UVD9UqXm3dyhPqd8W7kmWwiI6H'
};

// buildQueryForAPI 함수 정의
const buildQueryForAPI = (searchTerms, apiType) => {
  let query = '';
  
  switch(apiType) {
    case 'pixabay':
      query = searchTerms.baseTerms.join(' ');
      if (searchTerms.exactTerms.length) {
        query += ' ' + searchTerms.exactTerms.map(term => `"${term}"`).join(' ');
      }
      if (searchTerms.orTerms.length) {
        query += ' ' + searchTerms.orTerms.map(([t1, t2]) => `${t1} OR ${t2}`).join(' ');
      }
      break;
      
    case 'giphy':
    case 'flickr':
    case 'unsplash':
      query = [
        ...searchTerms.baseTerms,
        ...searchTerms.exactTerms.map(term => `"${term}"`),
        ...searchTerms.orTerms.map(([t1, t2]) => `(${t1} OR ${t2})`)
      ].join(' ');
      break;
    
    default:
      query = searchTerms.baseTerms.join(' ');
  }
  
  return query.trim();
};

// CC 라이선스 정식 아이콘 SVG 수정
const CCIcons = {
  by: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 496 512" fill="currentColor">
      <path d="M314.9 194.4v101.4h-28.3v120.5h-77.1V295.9h-28.3V194.4c0-4.4 1.6-8.2 4.6-11.3 3.1-3.1 6.9-4.7 11.3-4.7H299c4.1 0 7.8 1.6 11.1 4.7 3.1 3.2 4.8 6.9 4.8 11.3zm-101.5-63.7c0-23.3 11.5-35 34.5-35s34.5 11.7 34.5 35c0 23-11.5 34.5-34.5 34.5s-34.5-11.5-34.5-34.5zM247.6 8C389.4 8 496 118.1 496 256c0 147.1-118.5 248-248.4 248C113.6 504 0 394.5 0 256 0 123.1 104.7 8 247.6 8zm.8 44.7C130.2 52.7 44.7 150.6 44.7 256c0 109.8 91.2 202.8 203.7 202.8 103.2 0 202.8-81.1 202.8-202.8.1-113.8-90.2-203.3-202.8-203.3z"/>
    </svg>
  ),
  nc: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 496 512" fill="currentColor">
      <path d="M247.6 8C389.4 8 496 118.1 496 256c0 147.1-118.5 248-248.4 248C113.6 504 0 394.5 0 256 0 123.1 104.7 8 247.6 8zm.8 44.7C130.2 52.7 44.7 150.6 44.7 256c0 109.8 91.2 202.8 203.7 202.8 103.2 0 202.8-81.1 202.8-202.8.1-113.8-90.2-203.3-202.8-203.3zM155.7 384V264.6h-55.3V384h55.3zm0-167.2h-55.3v55.3h55.3v-55.3zm133.3 167.2V264.6h-55.3V384h55.3zm0-167.2h-55.3v55.3h55.3v-55.3zM247.6 384V264.6H192V384h55.6zm0-167.2H192v55.3h55.6v-55.3z"/>
    </svg>
  ),
  sa: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 496 512" fill="currentColor">
      <path d="M247.6 8C389.4 8 496 118.1 496 256c0 147.1-118.5 248-248.4 248C113.6 504 0 394.5 0 256 0 123.1 104.7 8 247.6 8zm.8 44.7C130.2 52.7 44.7 150.6 44.7 256c0 109.8 91.2 202.8 203.7 202.8 103.2 0 202.8-81.1 202.8-202.8.1-113.8-90.2-203.3-202.8-203.3zM137.7 221c13.3-13.3 29.3-20 47.9-20s34.6 6.7 47.9 20c13.3 13.3 20 29.3 20 47.9s-6.7 34.6-20 47.9c-13.3 13.3-29.3 20-47.9 20s-34.6-6.7-47.9-20c-13.3-13.3-20-29.3-20-47.9s6.7-34.6 20-47.9zm167.2 0c13.3-13.3 29.3-20 47.9-20s34.6 6.7 47.9 20c13.3 13.3 20 29.3 20 47.9s-6.7 34.6-20 47.9c-13.3 13.3-29.3 20-47.9 20s-34.6-6.7-47.9-20c-13.3-13.3-20-29.3-20-47.9s6.7-34.6 20-47.9z"/>
    </svg>
  ),
  nd: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 496 512" fill="currentColor">
      <path d="M247.6 8C389.4 8 496 118.1 496 256c0 147.1-118.5 248-248.4 248C113.6 504 0 394.5 0 256 0 123.1 104.7 8 247.6 8zm.8 44.7C130.2 52.7 44.7 150.6 44.7 256c0 109.8 91.2 202.8 203.7 202.8 103.2 0 202.8-81.1 202.8-202.8.1-113.8-90.2-203.3-202.8-203.3zM137.7 192h175v55h-175v-55zm0 110h175v55h-175v-55z"/>
    </svg>
  ),
  personal: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 496 512" fill="currentColor">
      <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 18.8-35.4 55.6-59.8 98.5-59.8 2.4 0 4.8.4 7.1 1.1 13 4.2 26.6 6.9 40.9 6.9 14.3 0 28-2.7 40.9-6.9 2.3-.7 4.7-1.1 7.1-1.1 42.9 0 79.7 24.4 98.5 59.8C359.3 421.4 306.7 448 248 448z"/>
    </svg>
  )
};

const LICENSE_INFO = {
  by: {
    icon: CCIcons.by,
    label: "BY",
    tooltip: "Attribution Required - Credit must be given to creator"
  },
  nc: {
    icon: CCIcons.nc,
    label: "NC",
    tooltip: "Non Commercial - Only for personal use"
  },
  sa: {
    icon: CCIcons.sa,
    label: "SA",
    tooltip: "Share Alike - Adaptations must be shared under same terms"
  },
  nd: {
    icon: CCIcons.nd,
    label: "ND",
    tooltip: "No Derivatives - No modifications allowed"
  }
};

// 기존 코드에 이 함수만 추가
const getLicenseText = (source, license) => {
  if (source === 'flickr') {
    switch(license) {
      case '0': return 'CC AR';
      case '1': return 'CC BY-NC-SA';
      case '2': return 'CC BY-NC';
      case '3': return 'CC BY-NC-ND';
      case '4': return 'CC BY';
      case '5': return 'CC BY-SA';
      case '6': return 'CC BY-ND';
      case '7': return 'CC NR';
      case '8': return 'CC US';
      case '9': return 'CC0';
      case '10': return 'CC PD';
      default: return 'CC UK';
    }
  } else if (source === 'giphy') {
    return 'Personal';
  } else if (source === 'unsplash' || source === 'pixabay') {
    return 'Free';
  }
  return '';
};

const getLicenseTooltip = (source, license) => {
  if (source === 'flickr') {
    switch(license) {
      case '0': return 'All Rights Reserved';
      case '1': return 'CC Attribution-NonCommercial-ShareAlike';
      case '2': return 'CC Attribution-NonCommercial';
      case '3': return 'CC Attribution-NonCommercial-NoDerivs';
      case '4': return 'CC Attribution';
      case '5': return 'CC Attribution-ShareAlike';
      case '6': return 'CC Attribution-NoDerivs';
      case '7': return 'No known copyright restrictions';
      case '8': return 'United States Government Work';
      case '9': return 'CC Zero';
      case '10': return 'Public Domain Mark';
      default: return 'Unknown License';
    }
  } else if (source === 'giphy') {
    return 'GIPHY Personal Use Only';
  } else if (source === 'unsplash') {
    return 'Unsplash License - Free for Commercial & Personal Use';
  } else if (source === 'pixabay') {
    return 'Pixabay License - Free for Commercial & Personal Use';
  }
  return '';
};

// getLicenseIcons 함수 수정 - 툴팁 제거
const getLicenseIcons = (source, license) => {
  if (source === 'flickr') {
    switch(license) {
      case '0': return <div className="flex gap-0.5 text-[10px]">AR</div>;
      case '1': return <div className="flex gap-0.5">{CCIcons.by}{CCIcons.nc}{CCIcons.sa}</div>;
      case '2': return <div className="flex gap-0.5">{CCIcons.by}{CCIcons.nc}</div>;
      case '3': return <div className="flex gap-0.5">{CCIcons.by}{CCIcons.nc}{CCIcons.nd}</div>;
      case '4': return <div className="flex gap-0.5">{CCIcons.by}</div>;
      case '5': return <div className="flex gap-0.5">{CCIcons.by}{CCIcons.sa}</div>;
      case '6': return <div className="flex gap-0.5">{CCIcons.by}{CCIcons.nd}</div>;
      case '7': return <div className="flex gap-0.5 text-[10px]">NR</div>;
      case '8': return <div className="flex gap-0.5 text-[10px]">US</div>;
      case '9': return <div className="flex gap-0.5">{CCIcons.by}</div>;
      case '10': return <div className="flex gap-0.5">{CCIcons.by}</div>;
      default: return <div className="flex gap-0.5 text-[10px]">UK</div>;
    }
  } else if (source === 'giphy') {
    return <div className="flex gap-0.5">{CCIcons.personal}</div>;
  } else if (source === 'unsplash' || source === 'pixabay') {
    return <div className="flex gap-0.5">{CCIcons.by}</div>;
  }
  return null;
};

// Flickr API 호출 부분 수정
const fetchFlickrImages = async (query, page) => {
  const perPage = 100;  // 한 번에 가져오는 이미지 수 증가
  const response = await axios.get(
    `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=${process.env.REACT_APP_FLICKR_KEY}&text=${query}&format=json&nojsoncallback=1&page=${page}&per_page=${perPage}&extras=url_h,url_l,owner_name,license&sort=relevance`
  );

  const flickrImages = response.data.photos.photo
    .filter(photo => photo.url_h || photo.url_l)  // 고해상도 이미지만 필터링
    .map(photo => ({
      id: `flickr-${photo.id}`,
      url: photo.url_h || photo.url_l,
      title: photo.title,
      source: 'flickr',
      author: photo.ownername || 'Unknown',
      source_url: `https://www.flickr.com/photos/${photo.owner}/${photo.id}`,
      license: String(photo.license)
    }));

  return flickrImages;
};

function App() {
  const inputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observer = useRef();
  const lastImageRef = useRef();
  const [isScrolled, setIsScrolled] = useState(false);
  const [error, setError] = useState(null);

  // 체크박스 상태 관리
  const [selectedSources, setSelectedSources] = useState({
    pixabay: true,
    giphy: true,
    flickr: true,
    unsplash: true  // Unsplash를 true로 정
  });

  // 라이선스 필터 상태
  const [licenseFilter, setLicenseFilter] = useState({
    commercial: true,    
    personal: true,      
    noModify: true,      
    other: true         
  });

  // 체크박스 변경 핸들러
  const handleSourceChange = (source) => {
    setSelectedSources(prev => ({
      ...prev,
      [source]: !prev[source]
    }));
  };

  // handleOptionClick 함수 추가
  const handleOptionClick = (option) => {
    const input = document.querySelector('input[type="text"]');
    const cursorPos = input.selectionStart;
    const textBefore = searchTerm.substring(0, cursorPos);
    const textAfter = searchTerm.substring(cursorPos);
    
    // 앞쪽 여백 처리
    const prefixSpace = textBefore.length > 0 && !textBefore.endsWith(' ') ? ' ' : '';
    
    let newValue;
    let newCursorPos;
    
    if (option === 'exact') {
      // Exact 버튼 클릭 시 따옴표 추가하고 커서를 따옴표 사이에 위치
      newValue = textBefore + prefixSpace + '""' + ' ' + textAfter;
      newCursorPos = cursorPos + prefixSpace.length + 1;
    } else if (option === 'exclude') {
      // Exclude 버튼 클릭 시 '-' 추가
      newValue = textBefore + prefixSpace + '-' + textAfter;
      newCursorPos = cursorPos + prefixSpace.length + 1;
    } else {
      // OR 버튼 클릭 시
      newValue = textBefore + prefixSpace + 'OR ' + textAfter;
      newCursorPos = cursorPos + prefixSpace.length + 3;
    }
    
    setSearchTerm(newValue);
    
    // 커서 위치 조정
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Intersection Observer 설정
  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (lastImageRef.current) {
      observer.current.observe(lastImageRef.current);
    }

    return () => observer.current?.disconnect();
  }, [isLoading]);

  // 검색 함수 수정
  const handleSearch = async (isNewSearch = true) => {
    if (!searchTerm.trim()) return;
    
    const processSearchTerm = (term) => {
      const terms = term.match(/(-?\w+|"[^"]+"|OR)/g) || [];
      let baseTerms = [];
      let excludeTerms = [];
      let exactTerms = [];
      let orTerms = [];

      for (let i = 0; i < terms.length; i++) {
        const currentTerm = terms[i];
        
        if (currentTerm.startsWith('-')) {
          excludeTerms.push(currentTerm.slice(1).toLowerCase());
        } else if (currentTerm === 'OR' && i > 0 && i < terms.length - 1) {
          orTerms.push([terms[i-1].toLowerCase(), terms[i+1].toLowerCase()]);
          i++;
        } else if (currentTerm.startsWith('"') && currentTerm.endsWith('"')) {
          exactTerms.push(currentTerm.slice(1, -1).toLowerCase());
        } else {
          baseTerms.push(currentTerm.toLowerCase());
        }
      }

      return { baseTerms, excludeTerms, exactTerms, orTerms };
    };

    const searchTerms = processSearchTerm(searchTerm);
    console.log('Processed search terms:', searchTerms);

    if (isNewSearch) {
      setImages([]);
      setPage(1);
      setHasMore(true);
    }

    setIsLoading(true);
    setError(null);
    
    const filterResults = (results, source) => {
      return results.filter(item => {
        let searchableText = '';
        
        // 각 API별 검색 가능한 텍스트 구성
        switch(source) {
          case 'pixabay':
            searchableText = [
              item.tags,
              item.user,
              item.pageURL
            ].filter(Boolean).join(' ').toLowerCase();
            break;
            
          case 'giphy':
            searchableText = [
              item.title,
              item.username,
              item.slug
            ].filter(Boolean).join(' ').toLowerCase();
            break;
            
          case 'unsplash':
            searchableText = [
              item.description,
              item.alt_description,
              item.user.name,
              item.user.username,
              item.user.bio,
              ...(item.tags || []).map(tag => tag.title)
            ].filter(Boolean).join(' ').toLowerCase();
            break;
            
          default:
            return true;  // 알 수 없는 소스는 모두 포함
        }
        
        if (!searchableText) return true;  // 검색 가능한 텍스트가 없으면 포함

        // 제외 검색어 확인
        if (searchTerms.excludeTerms.some(term => searchableText.includes(term))) {
          return false;
        }

        // 정확한 구문 검색 확인
        if (searchTerms.exactTerms.length > 0 && 
            !searchTerms.exactTerms.every(term => searchableText.includes(term))) {
          return false;
        }

        // 기본 검색어 확인
        if (searchTerms.baseTerms.length > 0 && 
            !searchTerms.baseTerms.every(term => searchableText.includes(term))) {
          return false;
        }

        // OR 검색어 확인
        if (searchTerms.orTerms.length > 0 && 
            !searchTerms.orTerms.some(([term1, term2]) => 
              searchableText.includes(term1) || searchableText.includes(term2))) {
          return false;
        }

        return true;
      });
    };

    try {
      let newImages = [];

      // Pixabay
      if (selectedSources.pixabay) {
        try {
          const query = buildQueryForAPI(searchTerms, 'pixabay');
          const response = await axios.get('https://pixabay.com/api/', {
            params: {
              key: '19355982-246ac9bfdb9874a93b479e573',
              q: query,
              per_page: 30,
              page: page,
              safesearch: true,
              image_type: 'photo'
            }
          });
          
          console.log('Pixabay Raw Response:', response.data.hits[0]);  // 첫 번째 이미지 데이터 확인
          
          if (response.data.hits) {
            const filteredResults = filterResults(response.data.hits, 'pixabay');
            const pixabayImages = filteredResults.map(img => ({
              id: `pixabay-${img.id}`,
              url: img.webformatURL,
              title: img.tags,
              source: 'pixabay',
              author: img.user,
              source_url: img.pageURL,
              license: 'cc0'
            }));
            newImages = [...newImages, ...pixabayImages];
          }
        } catch (error) {
          console.error('Pixabay Error:', error);
        }
      }

      // GIPHY
      if (selectedSources.giphy && !licenseFilter.commercial) {
        try {
          const query = buildQueryForAPI(searchTerms, 'giphy');
          const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
            params: {
              api_key: 'jUin8hTyF8GoHH3gzwtlzcew2nAEe2XU',
              q: query,
              limit: 30,
              offset: (page - 1) * 30,
              rating: 'g'
            }
          });
          
          console.log('GIPHY Raw Response:', response.data.data[0]);  // 첫 번째 미지 데이터 확인
          
          if (response.data.data) {
            let filteredResults = response.data.data;
            
            // 제외 검색어로 추가 필터링
            if (searchTerms.excludeTerms.length > 0) {
              filteredResults = filteredResults.filter(gif => {
                const searchableText = [gif.title, gif.username].join(' ').toLowerCase();
                return !searchTerms.excludeTerms.some(term => searchableText.includes(term.toLowerCase()));
              });
            }

            const giphyImages = filteredResults.map(gif => ({
              id: `giphy-${gif.id}`,
              url: gif.images.fixed_height.url,
              title: gif.title,
              source: 'giphy',
              author: gif.username,
              source_url: gif.url,
              license: 'nc'
            }));
            newImages = [...newImages, ...giphyImages];
          }
        } catch (error) {
          console.error('GIPHY Error:', error);
        }
      }

      // Flickr
      if (selectedSources.flickr) {
        try {
          const response = await fetchFlickrImages(searchTerm, page);
          newImages = [...newImages, ...response];
        } catch (error) {
          console.error('Flickr Error:', error);
        }
      }

      // Unsplash
      if (selectedSources.unsplash) {
        try {
          const query = buildQueryForAPI(searchTerms, 'unsplash');
          const response = await axios.get('https://api.unsplash.com/search/photos', {
            headers: {
              Authorization: 'Client-ID QPml8rW8m2EpVBnGH7VpyM3QmfGq4-VBgIxkozw6Xxk'
            },
            params: {
              query,
              per_page: 30,
              page: page
            }
          });

          if (response.data.results) {
            // 제외 검색어로 추가 필터링
            let filteredResults = response.data.results;
            if (searchTerms.excludeTerms.length > 0) {
              filteredResults = filteredResults.filter(photo => {
                const searchableText = [
                  photo.description,
                  photo.alt_description,
                  photo.user.name,
                  ...(photo.tags || []).map(tag => tag.title)
                ].filter(Boolean).join(' ').toLowerCase();

                return !searchTerms.excludeTerms.some(term => 
                  searchableText.includes(term.toLowerCase())
                );
              });
            }

            const unsplashImages = filteredResults.map(photo => ({
              id: `unsplash-${photo.id}`,
              url: photo.urls.regular,
              title: photo.description || photo.alt_description,
              source: 'unsplash',
              author: photo.user.name,
              source_url: photo.links.html,
              license: 'cc0'
            }));
            newImages = [...newImages, ...unsplashImages];
          }
        } catch (error) {
          console.error('Unsplash Error:', error);
        }
      }

      if (newImages.length > 0) {
        setImages(prevImages => [...prevImages, ...newImages]);
        setHasMore(newImages.length >= 30);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Search Error:', error);
      setError('An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };

  // 무한 스크롤 수정
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000 &&
        !isLoading && 
        hasMore
      ) {
        setPage(prev => prev + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, hasMore]);

  // 페이지 변경 시 검색 실행
  useEffect(() => {
    if (searchTerm && page > 1) {
      handleSearch(false);
    }
  }, [page, searchTerm]);

  const breakpointColumns = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  // 리셋 함수 추가
  const handleReset = () => {
    setSearchTerm('');
    setImages([]);
    setError(null);
    setIsLoading(false);
    setPage(1);
    setHasMore(true);
  };

  // 라이선스 필터링 함수
  const filterImagesByLicense = (images) => {
    return images.filter(image => {
      // GIPHY 이미지 (Personal Use Only)
      if (image.source === 'giphy') {
        return licenseFilter.personal;  // Personal Use Only 체크박스가 true일 때만 표시
      }
      
      // Flickr 이미지
      if (image.source === 'flickr') {
        const license = image.license;
        if (licenseFilter.commercial && ['4', '5', '9', '10'].includes(license)) return true;
        if (licenseFilter.personal && ['1', '2', '3'].includes(license)) return true;
        if (licenseFilter.noModify && ['3', '6'].includes(license)) return true;
        if (licenseFilter.other && ['0', '7', '8'].includes(license)) return true;
        return false;
      }
      
      // Pixabay & Unsplash (모든 용도 사용 가능)
      if (image.source === 'pixabay' || image.source === 'unsplash') {
        return true;  // 항상 표시
      }
      
      return false;
    });
  };

  // 필터링 적용
  const filteredImages = filterImagesByLicense(images);

  return (
    <div className="font-pretendard font-normal">
      <div className="h-32" />

      <header className="fixed top-0 left-0 right-0 bg-white z-50">
        <div className="max-w-[1400px] mx-auto px-8 h-24 flex items-center">
          {/* 로고 영역 */}
          <div className="w-52 flex items-center">
            <h1 className="font-['Poppins'] font-bold text-2xl bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent hover:from-pink-500 hover:to-purple-500 transition-all duration-300 cursor-pointer" onClick={handleReset}>
              <span className="flex items-center gap-2">
                Pic Moeum
              </span>
            </h1>
          </div>

          {/* 검색 영역 */}
          <div className="ml-4 flex-1">
            <div className="ml-2 w-[464px] pt-9 pb-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  className="w-full h-10 pl-4 pr-10 text-sm rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Search..."
                />
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={handleSearch}
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span 
                  className="text-xs text-gray-400 cursor-pointer" 
                  onClick={() => {
                    setSearchTerm(prev => prev + ' -');
                    inputRef.current?.focus();
                  }}
                >
                  -exclude
                </span>
                <span 
                  className="text-xs text-gray-400 cursor-pointer"
                  onClick={() => {
                    setSearchTerm(prev => `"${prev}"`);
                    inputRef.current?.focus();
                  }}
                >
                  exact
                </span>
                <span 
                  className="text-xs text-gray-400 cursor-pointer"
                  onClick={() => {
                    setSearchTerm(prev => prev + ' | ');
                    inputRef.current?.focus();
                  }}
                >
                  or
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-8 flex gap-4">
        <aside className="fixed w-52 h-[calc(100vh-8rem)] py-4 top-28">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Image Source</h2>
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input 
                type="checkbox" 
                className="rounded border-gray-300"
                checked={selectedSources.unsplash}
                onChange={() => handleSourceChange('unsplash')}
              />
              Unsplash
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input 
                type="checkbox" 
                className="rounded border-gray-300"
                checked={selectedSources.pixabay}
                onChange={() => handleSourceChange('pixabay')}
              />
              Pixabay
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input 
                type="checkbox" 
                className="rounded border-gray-300"
                checked={selectedSources.flickr}
                onChange={() => handleSourceChange('flickr')}
              />
              Flickr
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input 
                type="checkbox" 
                className="rounded border-gray-300"
                checked={selectedSources.giphy}
                onChange={() => handleSourceChange('giphy')}
              />
              GIPHY
            </label>
          </div>

          <h2 className="text-sm font-medium text-gray-900 mt-8 mb-4">License</h2>
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input 
                type="checkbox" 
                className="rounded border-gray-300"
                checked={licenseFilter.commercial}
                onChange={() => setLicenseFilter(prev => ({...prev, commercial: !prev.commercial}))}
              />
              Commercial Use
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input 
                type="checkbox" 
                className="rounded border-gray-300"
                checked={licenseFilter.personal}
                onChange={() => setLicenseFilter(prev => ({...prev, personal: !prev.personal}))}
              />
              Personal Use Only
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input 
                type="checkbox" 
                className="rounded border-gray-300"
                checked={licenseFilter.noModify}
                onChange={() => setLicenseFilter(prev => ({...prev, noModify: !prev.noModify}))}
              />
              No Modifications
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input 
                type="checkbox" 
                className="rounded border-gray-300"
                checked={licenseFilter.other}
                onChange={() => setLicenseFilter(prev => ({...prev, other: !prev.other}))}
              />
              Other Licenses
            </label>
          </div>
        </aside>

        <main className="ml-[232px] flex-1 pt-2">
          {error && (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          <Masonry
            breakpointCols={breakpointColumns}
            className="flex -ml-2 w-auto"
            columnClassName="pl-2 bg-clip-padding"
          >
            {filteredImages.map((image) => (
              <div key={image.id} className="mb-2 relative group">
                <img
                  src={image.url}
                  alt={image.title}
                  loading="lazy"
                  className="w-full rounded-lg transition-opacity"
                />
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                     onClick={(e) => {
                       if (e.target === e.currentTarget) {
                         window.open(image.url, '_blank');
                       }
                     }}>
                  <div className="absolute bottom-4 left-4">
                    <p className="text-white text-sm opacity-0 group-hover:opacity-100">
                      {image.title}
                    </p>
                    <p className="text-white text-xs opacity-0 group-hover:opacity-100">
                      by {image.author}
                    </p>
                  </div>
                  <div className="absolute top-4 right-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100">
                    <div className="text-white group/license relative cursor-help">
                      {getLicenseIcons(image.source.toLowerCase(), image.license)}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/75 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover/license:opacity-100 transition-opacity duration-200 delay-300">
                        {getLicenseTooltip(image.source.toLowerCase(), image.license)}
                      </div>
                    </div>
                    <a
                      href={image.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-black bg-white px-2 py-1 rounded hover:bg-opacity-90"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      출처
                    </a>
                    <span className="text-xs text-white bg-black px-2 py-1 rounded">
                      {image.source}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </Masonry>

          {isLoading && (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading more images...</p>
            </div>
          )}

          {!hasMore && images.length > 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No more images to load.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
