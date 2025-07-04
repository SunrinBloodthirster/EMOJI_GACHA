const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

// 'drawEmoji' 함수를 v1 SDK 방식으로 export 합니다.
exports.drawEmoji = functions
  .region("us-central1")
  .https.onRequest((request, response) => {
    // cors 핸들러가 요청과 응답을 먼저 처리하도록 합니다.
    cors(request, response, async () => {
      // 인증 헤더 확인
      if (
        !request.headers.authorization ||
        !request.headers.authorization.startsWith("Bearer ")
      ) {
        console.error(
          "No Firebase ID token was passed as a Bearer token in the Authorization header."
        );
        response.status(401).send("Unauthorized");
        return;
      }

      // 토큰 추출 및 검증
      const idToken = request.headers.authorization.split("Bearer ")[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log("✅ 인증 성공! 사용자:", decodedToken.uid);

        // 게임 로직
        const emojis = ["😀", "😍", "🥳", "🚀", "💎", "💯", "🔥"];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        // 성공 응답 전송
        response.status(200).json({ emoji: randomEmoji });
      } catch (error) {
        console.error("❌ 인증 토큰 검증 실패:", error);
        response.status(401).send("Unauthorized");
      }
    });
  });