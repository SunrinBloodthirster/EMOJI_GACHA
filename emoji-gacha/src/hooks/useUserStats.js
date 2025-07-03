import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import emojiData from '../emojiData.json';

const useUserStats = () => {
  const [stats, setStats] = useState({
    totalPulls: 0,
    legendaryCount: 0,
    epicCount: 0,
    rareCount: 0,
    uncommonCount: 0,
    commonCount: 0,
    completionRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false); // 사용자 인증 상태 로드 완료
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      if (user) {
        setIsLoading(true);
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const collectedEmojis = userData.collectedEmojis || [];

          const totalPulls = collectedEmojis.length;
          let legendaryCount = 0;
          let epicCount = 0;
          let rareCount = 0;
          let uncommonCount = 0;
          let commonCount = 0;
          const uniqueCollectedEmojiIds = new Set(collectedEmojis);

          collectedEmojis.forEach(emojiId => {
            const emoji = emojiData.emojis.find(e => e.id === emojiId);
            if (emoji) {
              switch (emoji.rarity) {
                case 'Legendary':
                  legendaryCount++;
                  break;
                case 'Epic':
                  epicCount++;
                  break;
                case 'Rare':
                  rareCount++;
                  break;
                case 'Uncommon':
                  uncommonCount++;
                  break;
                case 'Common':
                  commonCount++;
                  break;
                default:
                  break;
              }
            }
          });

          const totalUniqueEmojis = emojiData.emojis.length;
          const completionRate = totalUniqueEmojis > 0 
            ? (uniqueCollectedEmojiIds.size / totalUniqueEmojis) * 100 
            : 0;

          setStats({
            totalPulls,
            legendaryCount,
            epicCount,
            rareCount,
            uncommonCount,
            commonCount,
            completionRate: completionRate.toFixed(2), // 소수점 둘째 자리까지
          });
        }
        setIsLoading(false);
      } else {
        // 로그아웃 상태일 때 통계 초기화
        setStats({
          totalPulls: 0,
          legendaryCount: 0,
          epicCount: 0,
          rareCount: 0,
          uncommonCount: 0,
          commonCount: 0,
          completionRate: 0,
        });
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]); // user 객체가 변경될 때마다 통계 다시 계산

  return { stats, isLoading };
};

export default useUserStats;
