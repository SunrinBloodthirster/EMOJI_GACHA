import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';

// emojiData.json 파일을 직접 임포트합니다.
// 경로가 다를 수 있으니, 실제 파일 위치에 맞게 수정해야 할 수도 있습니다.
import allEmojisData from '../data/emojiData.json';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [collectedEmojis, setCollectedEmojis] = useState([]);
    const [allEmojis, setAllEmojis] = useState([]); // 전체 이모지 목록 상태
    const [isLoading, setIsLoading] = useState(true);
    const [authIsReady, setAuthIsReady] = useState(false); // 이 라인을 추가하세요
    const [error, setError] = useState(null); // 에러 상태 추가

    useEffect(() => {
        const auth = getAuth();
        const db = getFirestore();

        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser); // 유저 정보 업데이트
            setAuthIsReady(true); // 인증 상태 확인 완료!
            if (authUser) {
                // 로그인 시, 해당 유저의 데이터를 실시간으로 구독합니다.
                const userDocRef = doc(db, 'users', authUser.uid);
                const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setCollectedEmojis(docSnap.data().collectedEmojis || []);
                        setError(null); // 성공적으로 데이터를 가져오면 에러 초기화
                    } else {
                        setCollectedEmojis([]);
                        setError(null); // 문서가 없으면 에러 초기화
                    }
                    setIsLoading(false);
                }, (err) => {
                    console.error("Error fetching user data:", err);
                    setError(err); // 에러 발생 시 에러 상태 업데이트
                    setIsLoading(false);
                });

                // 전체 이모지 데이터도 상태에 저장합니다.
                setAllEmojis(allEmojisData.emojis); // allEmojisData.emojis로 수정

                return () => unsubDoc(); // 클린업
            } else {
                setCollectedEmojis([]);
                setIsLoading(false);
                setError(null); // 로그아웃 시 에러 초기화
            }
        });

        return () => unsubscribe(); // 클린업
    }, []);

    const value = {
        user,
        collectedEmojis,
        allEmojis,
        isLoading,
        error, // 에러 상태 추가
        authIsReady // 하위 컴포넌트에 제공
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};