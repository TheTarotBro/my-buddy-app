import admin from "firebase-admin";

function getAdmin() {
  if (admin.apps.length) return admin;
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://eurovision-2026-app-default-rtdb.firebaseio.com"
  });
  return admin;
}

function chicagoParts(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false
  }).formatToParts(date);
  const get = (t) => parts.find(p => p.type === t).value;
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  return {
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
    month: parseInt(get("month"), 10),
    day: parseInt(get("day"), 10),
    hour
  };
}

export default async function handler(req, res) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${expected}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const adm = getAdmin();
  const db = adm.database();
  const now = chicagoParts(new Date());

  const snap = await db.ref("buddy").once("value");
  const allData = snap.val() || {};

  const messagesToSend = [];
  const writes = [];

  for (const uid of Object.keys(allData)) {
    const userData = allData[uid] || {};
    const notifSettings = (userData.settings && userData.settings.notifications) || null;
    if (!notifSettings || !notifSettings.enabled) continue;

    const targetHour = Number.isInteger(notifSettings.hour) ? notifSettings.hour : 8;
    if (now.hour !== targetHour) continue;
    if (notifSettings.lastSentDate === now.dateStr) continue;

    const birthdays = userData.birthdays || {};
    const todayNames = [];
    for (const personId of Object.keys(birthdays)) {
      const person = birthdays[personId];
      if (!person || !person.date) continue;
      const bits = String(person.date).split("-");
      if (bits.length !== 3) continue;
      const m = parseInt(bits[1], 10), d = parseInt(bits[2], 10);
      if (m === now.month && d === now.day && person.name) todayNames.push(person.name);
    }

    const tokens = Object.keys(userData.fcmTokens || {});
    if (todayNames.length > 0 && tokens.length > 0) {
      const title = todayNames.length === 1 ? "\ud83c\udf82 Birthday today" : "\ud83c\udf82 Birthdays today";
      const body = todayNames.length === 1
        ? `${todayNames[0]}'s birthday is today!`
        : `${todayNames.join(", ")} — birthdays today!`;
      for (const token of tokens) {
        messagesToSend.push({ token, notification: { title, body } });
      }
    }

    writes.push(db.ref(`buddy/${uid}/settings/notifications/lastSentDate`).set(now.dateStr));
  }

  let successCount = 0, failureCount = 0, errors = [];
  if (messagesToSend.length > 0) {
    const result = await adm.messaging().sendEach(messagesToSend);
    successCount = result.successCount;
    failureCount = result.failureCount;
    result.responses.forEach((r) => { if (!r.success) errors.push({ error: r.error && r.error.message }); });
  }
  await Promise.all(writes);

  res.status(200).json({ checked: true, evaluatedUsers: Object.keys(allData).length, sent: successCount, failed: failureCount, errors });
}
