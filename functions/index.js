const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();
const emojiData = require("./emojiData.json");

exports.drawEmoji = functions.https.onCall(async (data, context) => {
  // [보안] 함수 시작 부분에서 context.auth 객체를 확인하여, 인증된 사용자가 아닐 경우 에러 반환 로직 추가
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // 기존 src/utils.js에 있던 확률 기반 이모지 뽑기 로직을 함수 내에 그대로 재구현
  const rand = Math.random();
  let cumulativeProbability = 0;
  let drawnEmoji = null;

  for (const rarity in emojiData.rarityProbabilities) {
    if (Object.prototype.hasOwnProperty.call(emojiData.rarityProbabilities, rarity)) {
      cumulativeProbability += emojiData.rarityProbabilities[rarity];
      if (rand < cumulativeProbability) {
        const emojisOfRarity = emojiData.emojis.filter((e) => e.rarity === rarity);
        if (emojisOfRarity.length > 0) {
          drawnEmoji = emojisOfRarity[
            Math.floor(Math.random() * emojisOfRarity.length)
          ];
          break; // 이모지를 찾았으니 루프 종료
        }
      }
    }
  }

  // Fallback: 만약 모든 확률 계산 후에도 이모지가 선택되지 않은 경우
  // 또는 특정 등급의 이모지 배열이 비어있는 경우를 대비한 폴백
  if (!drawnEmoji && emojiData.emojis.length > 0) {
    drawnEmoji = emojiData.emojis[Math.floor(Math.random() * emojiData.emojis.length)];
  }

  if (!drawnEmoji) {
    throw new functions.https.HttpsError(
      "not-found",
      "No emoji could be drawn."
    );
  }

  // [DB 쓰기] 뽑기가 완료되면, context.auth.uid를 사용해 해당 유저의 Firestore 문서를 찾아 collectedEmojis 필드에 뽑힌 이모지 데이터를 FieldValue.arrayUnion()으로 추가
  const userId = context.auth.uid;
  const userRef = db.collection("users").doc(userId);

  try {
    await userRef.update({
      collectedEmojis: admin.firestore.FieldValue.arrayUnion(drawnEmoji),
    });
  } catch (error) {
    // 문서가 없거나 필드가 없는 경우 등 에러 처리
    if (error.code === 5 || error.code === 7) { // 5: NOT_FOUND, 7: PERMISSION_DENIED (if user doc doesn't exist)
      // If the user document doesn't exist, create it with the first emoji
      await userRef.set(
        {
          collectedEmojis: [drawnEmoji],
        },
        { merge: true } // Use merge: true to avoid overwriting other fields if they exist
      );
    } else {
      console.error("Error updating user document:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to update user data.",
        error.message
      );
    }
  }

  // [결과 반환] 클라이언트에게 뽑힌 이모지 객체를 return
  return drawnEmoji;
});