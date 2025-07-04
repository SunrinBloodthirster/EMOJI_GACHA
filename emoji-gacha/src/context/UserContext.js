// src/context/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import allEmojisData from '../data/emojiData.json'; // emojiData.json 위치는 src 폴더 바로 아래

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authIsReady, setAuthIsReady] = useState(false);
    const [collectedEmojis, setCollectedEmojis] = useState([]);
    const [allEmojis, setAllEmojis] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const db = getFirestore();
        setAllEmojis(allEmojisData); // 전체 이모지 데이터는 동기적으로 먼저 로드

        let unsubscribeSnapshot = null; // Declare unsubscribeSnapshot here

        // 인증 상태가 바뀌는 것을 감지하는 리스너 설정
        const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
            if (authUser) {
                // 로그인 상태일 때
                setUser(authUser);
                const userDocRef = doc(db, 'users', authUser.uid);

                // 유저의 데이터를 실시간으로 감지
                unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setCollectedEmojis(docSnap.data().collectedEmojis || []);
                    }
                    setIsLoading(false); // 유저 데이터까지 받아오면 로드 완료
                    setAuthIsReady(true); // 인증 및 데이터 로드 모두 준비 완료
                });

            } else {
                // 로그아웃 상태일 때
                setUser(null);
                setCollectedEmojis([]);
                setIsLoading(false);
                setAuthIsReady(true); // 로그아웃 상태도 '준비 완료'
                if (unsubscribeSnapshot) {
                    unsubscribeSnapshot(); // Clean up Firestore listener on logout
                }
            }
        });

        return () => {
            unsubscribeAuth(); // Clean up auth listener
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot(); // Clean up Firestore listener when component unmounts
            }
        };
    }, []);

    const value = {
        user,
        authIsReady,
        collectedEmojis,
        allEmojis,
        isLoading,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};