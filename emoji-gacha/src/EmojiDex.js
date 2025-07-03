import React, { useState, useEffect, useMemo, useRef } from 'react';
import { doc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebase';
import EmojiDetailModal from './EmojiDetailModal';
import CompletionGauge from './components/CompletionGauge'; // CompletionGauge 임포트
import { useUser } from './context/UserContext'; // useUser 훅 임포트
import './EmojiDex.css'; // EmojiDex 전용 CSS 파일 임포트

const EMOJIS_PER_PAGE_MOBILE = 9; // 모바일 한 페이지에 표시할 이모지 개수

const EmojiDex = () => {
  const { user, userProfile, collectedEmojis, isLoading, allEmojis } = useUser();

  const [selectedFeaturedEmojis, setSelectedFeaturedEmojis] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [selectedRarityFilter, setSelectedRarityFilter] = useState('All'); // 필터 상태 추가
  const [touchedEmojiId, setTouchedEmojiId] = useState(null); // 모바일 터치 시 이름 표시를 위한 상태
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768); // 모바일 뷰 상태
  const [rarityPages, setRarityPages] = useState({}); // 각 등급별 현재 페이지 (모바일 캐러셀용)
  const [showCollectedOnly, setShowCollectedOnly] = useState(false); // 보유 이모지 필터 상태

  // Refs
  const carouselRefs = useRef({}); // 각 캐러셀의 DOM 요소를 참조 (모바일 캐러셀용)

  // Memoized values
  const raritiesOrder = useMemo(() => ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'], []); // 등급 순서 정의 및 메모이제이션

  const filteredEmojis = useMemo(() => {
    let emojisToFilter = allEmojis;

    if (selectedRarityFilter !== 'All') {
      emojisToFilter = emojisToFilter.filter(emoji => emoji.rarity === selectedRarityFilter);
    }

    if (showCollectedOnly) {
      emojisToFilter = emojisToFilter.filter(emoji => collectedEmojis.includes(emoji.id));
    }

    return emojisToFilter;
  }, [selectedRarityFilter, showCollectedOnly, collectedEmojis, allEmojis]);

  // 등급별로 이모지를 그룹화 (모바일 캐러셀용)
  const groupedEmojisByRarity = useMemo(() => {
    const grouped = {};
    raritiesOrder.forEach(rarity => {
      let emojisInRarity = allEmojis.filter(emoji => emoji.rarity === rarity);
      if (showCollectedOnly) {
        emojisInRarity = emojisInRarity.filter(emoji => collectedEmojis.includes(emoji.id));
      }
      grouped[rarity] = emojisInRarity;
    });
    return grouped;
  }, [raritiesOrder, showCollectedOnly, collectedEmojis, allEmojis]);

  // Effects
  useEffect(() => {
    if (userProfile) {
      setSelectedFeaturedEmojis(userProfile.featuredEmojis || []);
    }
  }, [userProfile]);

  // 윈도우 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 모바일 캐러셀 페이지 초기화
  useEffect(() => {
    const initialPages = {};
    Object.keys(groupedEmojisByRarity).forEach(rarity => {
      initialPages[rarity] = 0;
    });
    setRarityPages(initialPages);
  }, [groupedEmojisByRarity]);

  if (isLoading || !allEmojis) {
    return <div>이모지 데이터를 불러오는 중입니다...</div>;
  }

  // Event Handlers and other functions
  const handleFilterTabClick = (rarity) => {
    setSelectedRarityFilter(rarity);
    // 해당 등급 섹션으로 스크롤 이동
    const targetElement = document.getElementById(rarity.toLowerCase());
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleEmojiClick = (emojiId, isCollected) => {
    if (!isCollected) return; // 미수집 이모지는 클릭해도 아무것도 하지 않음

    const emoji = allEmojis.find(e => e.id === emojiId);

    if (isMobileView) {
      if (touchedEmojiId === emojiId) {
        // 이미 터치되어 이름이 보이는 상태에서 다시 터치 -> 모달 열기
        setSelectedEmoji(emoji);
        setIsModalOpen(true);
        setTouchedEmojiId(null); // 모달 열리면 이름 숨김
      } else {
        // 첫 터치 -> 이름 표시
        setTouchedEmojiId(emojiId);
        setSelectedEmoji(emoji); // 선택된 이모지 설정 (모달에서 사용)
      }
    } else {
      // PC 환경 (클릭 이벤트) 처리 -> 바로 모달 열기
      setSelectedEmoji(emoji);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmoji(null);
    setTouchedEmojiId(null); // 모달 닫을 때 이름 숨김
  };

  const handleSetFeaturedEmoji = async () => {
    if (!user || !selectedEmoji) return; // selectedEmoji를 사용

    const userDocRef = doc(db, 'users', user.uid);
    const isAlreadyFeatured = selectedFeaturedEmojis.includes(selectedEmoji.id); // selectedEmoji.id를 사용

    let newFeaturedEmojis;
    if (isAlreadyFeatured) {
      newFeaturedEmojis = arrayRemove(selectedEmoji.id); // selectedEmoji.id를 사용
    } else {
      if (selectedFeaturedEmojis.length < 3) {
        newFeaturedEmojis = arrayUnion(selectedEmoji.id); // selectedEmoji.id를 사용
      } else {
        alert('대표 이모지는 최대 3개까지 선택할 수 있습니다.');
        return;
      }
    }

    await setDoc(userDocRef, { featuredEmojis: newFeaturedEmojis }, { merge: true });
  };

  const isFeaturedButtonDisabled = !user || !selectedEmoji || (selectedFeaturedEmojis.length >= 3 && !selectedFeaturedEmojis.includes(selectedEmoji.id));

  // 모바일 캐러셀 페이지 변경 핸들러
  const handleMobilePageChange = (rarity, direction) => {
    setRarityPages(prev => {
      const emojisInRarity = groupedEmojisByRarity[rarity];
      const totalPages = Math.ceil(emojisInRarity.length / EMOJIS_PER_PAGE_MOBILE);
      let newPage = (prev[rarity] || 0) + direction;
      if (newPage < 0) newPage = 0;
      if (newPage >= totalPages) newPage = totalPages - 1;

      if (carouselRefs.current[rarity]) {
        const scrollAmount = carouselRefs.current[rarity].clientWidth * newPage;
        carouselRefs.current[rarity].scrollTo({ left: scrollAmount, behavior: 'smooth' });
      }
      return { ...prev, [rarity]: newPage };
    });
  };

  if (isLoading) {
    return <div className="loading-spinner"></div>;
  }

  const noEmojisFound = filteredEmojis.length === 0; // PC 뷰에서 이모지가 없는지 확인
  const noGroupedEmojisFound = Object.values(groupedEmojisByRarity).every(arr => arr.length === 0); // 모바일 뷰에서 이모지가 없는지 확인

  return (
    <div className="emoji-dex-container">
      <h2 style={{ fontSize: 'var(--font-size-xxl)', marginBottom: 'var(--spacing-lg)' }}>이모지 도감</h2>

      {/* StatsAndGauge 컴포넌트 제거 */}
      {isLoading ? (
        <p>완성도 로딩 중...</p>
      ) : (
        <CompletionGauge />
      )}

      <div className="filter-tabs">
        <button
          className={`filter-tab ${selectedRarityFilter === 'All' ? 'active' : ''}`}
          onClick={() => handleFilterTabClick('All')}
        >
          전체
        </button>
        {raritiesOrder.map(rarity => (
          <button
            key={rarity}
            className={`filter-tab ${selectedRarityFilter === rarity ? 'active' : ''}`}
            onClick={() => handleFilterTabClick(rarity)}
          >
            {rarity}
          </button>
        ))}
        <label className="collected-toggle">
          <input
            type="checkbox"
            checked={showCollectedOnly}
            onChange={() => setShowCollectedOnly(!showCollectedOnly)}
          />
          보유 이모지
        </label>
      </div>

      {isMobileView ? (
        // 모바일 캐러셀 레이아웃
        <div className="mobile-carousel-layout">
          {noGroupedEmojisFound && (
            <p className="no-emojis-message">
              {showCollectedOnly ? '보유한 이모지가 없습니다.' : '아직 이 등급의 이모지를 모으지 못했어요!'}
            </p>
          )}
          {!noGroupedEmojisFound && raritiesOrder.map(rarity => {
            const emojisInRarity = groupedEmojisByRarity[rarity];
            if (selectedRarityFilter !== 'All' && selectedRarityFilter !== rarity) {
              return null; // 필터링된 등급만 표시
            }
            // 보유 이모지 필터가 활성화되어 있고 해당 등급에 이모지가 없으면 렌더링하지 않음
            if (showCollectedOnly && emojisInRarity.length === 0) {
              return null;
            }

            const totalPages = Math.ceil(emojisInRarity.length / EMOJIS_PER_PAGE_MOBILE);
            const currentPage = rarityPages[rarity] || 0;
            const startIndex = currentPage * EMOJIS_PER_PAGE_MOBILE;
            const endIndex = startIndex + EMOJIS_PER_PAGE_MOBILE;
            const currentEmojis = emojisInRarity.slice(startIndex, endIndex);

            return (
              <div key={rarity} className="rarity-section">
                <h3 id={rarity.toLowerCase()}>{rarity}</h3>
                <div className="emoji-carousel-container">
                  <div className="emoji-carousel" ref={el => carouselRefs.current[rarity] = el}>
                    <div className="emoji-carousel-page">
                      {currentEmojis.map((emoji) => {
                        const isCollected = collectedEmojis.includes(emoji.id);
                        const isFeatured = selectedFeaturedEmojis.includes(emoji.id);
                        const isNameVisible = touchedEmojiId === emoji.id;

                        return (
                          <div
                            key={emoji.id}
                            title={emoji.name}
                            onClick={() => handleEmojiClick(emoji.id, isCollected)}
                            className={`emoji-card ${isCollected ? 'collected' : 'uncollected'} ${isFeatured ? 'featured' : ''} ${isNameVisible ? 'name-visible' : ''} rarity-${emoji.rarity.toLowerCase()}`}
                          >
                            <div className="emoji-display">{emoji.emoji}</div>
                            <div className="emoji-name">{emoji.name}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {totalPages > 1 && (
                    <div className="pagination-controls">
                      <button onClick={() => handleMobilePageChange(rarity, -1)} disabled={currentPage === 0}>
                        이전
                      </button>
                      <span>{currentPage + 1} / {totalPages}</span>
                      <button onClick={() => handleMobilePageChange(rarity, 1)} disabled={currentPage === totalPages - 1}>
                        다음
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // PC 그리드 레이아웃
        <div className="emoji-card-grid">
          {noEmojisFound && (
            <p className="no-emojis-message">
              {showCollectedOnly ? '보유한 이모지가 없습니다.' : '아직 이 등급의 이모지를 모으지 못했어요!'}
            </p>
          )}
          {!noEmojisFound && filteredEmojis.map((emoji) => {
            const isCollected = collectedEmojis.includes(emoji.id);
            const isFeatured = selectedFeaturedEmojis.includes(emoji.id);

            return (
              <div
                key={emoji.id}
                title={emoji.name}
                onClick={() => handleEmojiClick(emoji.id, isCollected)}
                onMouseEnter={() => window.innerWidth > 768 && setTouchedEmojiId(emoji.id)} // PC에서 호버 시 이름 표시
                onMouseLeave={() => window.innerWidth > 768 && setTouchedEmojiId(null)} // PC에서 호버 해제 시 이름 숨김
                className={`emoji-card ${isCollected ? 'collected' : 'uncollected'} ${isFeatured ? 'featured' : ''} rarity-${emoji.rarity.toLowerCase()}`}
              >
                <div className="emoji-display">{emoji.emoji}</div>
                <div className="emoji-name">{emoji.name}</div>
              </div>
            );
          })}
        </div>
      )}

      {user && selectedEmoji && collectedEmojis.includes(selectedEmoji.id) && ( // selectedEmoji를 사용
        <button onClick={handleSetFeaturedEmoji} disabled={isFeaturedButtonDisabled}>
          {selectedFeaturedEmojis.includes(selectedEmoji.id) ? '대표 이모지 해제' : '대표 이모지로 설정하기'}
        </button>
      )}
      {isModalOpen && (
        <EmojiDetailModal emoji={selectedEmoji} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default EmojiDex;