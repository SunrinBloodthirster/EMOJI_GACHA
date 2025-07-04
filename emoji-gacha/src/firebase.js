import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  // Firebase 콘솔에서 복사한 실제 값을 넣거나,
  // "your-..." 형태의 가짜 값을 넣어도 에뮬레이터는 대부분 동작합니다.
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// 사용할 서비스 인스턴스 가져오기
const auth = getAuth(app);
const functions = getFunctions(app);
const db = getFirestore(app);

// 개발 환경일 때만 에뮬레이터에 연결
if (window.location.hostname === "localhost") {
  console.log("개발 환경입니다. Firebase 에뮬레이터에 연결합니다.");
  
  // 각 서비스 에뮬레이터에 연결
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFunctionsEmulator(functions, "localhost", 5001);
  connectFirestoreEmulator(db, 'localhost', 8080);
}

// 다른 파일에서 사용할 수 있도록 export
export { auth, functions, db };