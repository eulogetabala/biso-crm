const API_KEY = "AIzaSyAgxUuP_1S0xBjN8stO7mZMJmj9rqCX68g";
const PROJECT_ID = "connecthub-f4ef1";

const ADMIN = {
  email: "admin@bisoexpress.com",
  password: "BisoAdmin2025!",
  firstName: "Admin",
  lastName: "Biso",
};

async function signUp(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

async function signIn(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

async function setUserDoc(token, uid) {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fields: {
          id: { stringValue: uid },
          firstName: { stringValue: ADMIN.firstName },
          lastName: { stringValue: ADMIN.lastName },
          email: { stringValue: ADMIN.email },
          role: { stringValue: "admin" },
          isActive: { booleanValue: true },
          createdAt: { timestampValue: new Date().toISOString() },
          updatedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Erreur Firestore");
  }
}

async function main() {
  try {
    console.log("Création de l'utilisateur admin...");
    let token, uid;
    try {
      const data = await signUp(ADMIN.email, ADMIN.password);
      token = data.idToken;
      uid = data.localId;
    } catch {
      console.log("Utilisateur déjà existant, connexion...");
      const data = await signIn(ADMIN.email, ADMIN.password);
      token = data.idToken;
      uid = data.localId;
    }

    console.log("Écriture du profil admin dans Firestore...");
    await setUserDoc(token, uid);

    console.log("\n✅ Admin prêt !");
    console.log(`   Email    : ${ADMIN.email}`);
    console.log(`   Password : ${ADMIN.password}`);
    process.exit(0);
  } catch (error) {
    console.error("Erreur :", error.message);
    process.exit(1);
  }
}

main();
