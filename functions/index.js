const functions = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

// Load emoji data from local JSON
const emojiData = require("./emojiData.json");

// Force redeployment by adding a comment
exports.drawEmoji = functions.https.onCall(async (data, context) => {
  // Log the invocation with authentication context
  logger.info("drawEmoji function called", { auth: context.auth });

  // Security: Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { uid } = context.auth;
  const userRef = db.collection("users").doc(uid);

  // Emoji drawing logic based on rarity probabilities
  const rand = Math.random();
  let cumulativeProbability = 0;
  let drawnEmoji = null;

  for (const rarity in emojiData.rarityProbabilities) {
    if (Object.prototype.hasOwnProperty.call(emojiData.rarityProbabilities, rarity)) {
      cumulativeProbability += emojiData.rarityProbabilities[rarity];
      if (rand < cumulativeProbability) {
        const emojisOfRarity = emojiData.emojis.filter((e) => e.rarity === rarity);
        if (emojisOfRarity.length > 0) {
          drawnEmoji = emojisOfRarity[Math.floor(Math.random() * emojisOfRarity.length)];
          break;
        }
      }
    }
  }

  // Fallback if no emoji is drawn
  if (!drawnEmoji) {
    if (emojiData.emojis.length > 0) {
      drawnEmoji = emojiData.emojis[Math.floor(Math.random() * emojiData.emojis.length)];
    } else {
      throw new functions.https.HttpsError("not-found", "No emoji could be drawn.");
    }
  }

  // Atomically update user data in Firestore
  try {
    await userRef.update({
      collectedEmojis: FieldValue.arrayUnion(drawnEmoji),
      totalPulls: FieldValue.increment(1),
      lastPullTimestamp: FieldValue.serverTimestamp(),
      lastPulledEmojiId: drawnEmoji.id,
    });
  } catch (error) {
    // If the user document does not exist, create it
    if (error.code === 5) { // 5 = NOT_FOUND
      await userRef.set({
        collectedEmojis: [drawnEmoji],
        totalPulls: 1,
        lastPullTimestamp: FieldValue.serverTimestamp(),
        lastPulledEmojiId: drawnEmoji.id,
      }, { merge: true });
    } else {
      logger.error("Error updating user document for user:", uid, error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to update user data.",
        error.message
      );
    }
  }

  // Return the drawn emoji to the client
  return drawnEmoji;
});
