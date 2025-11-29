import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- CONFIGURAÇÃO DO FIREBASE ---
// Agora usamos variáveis de ambiente (Environment Variables).
// Isso impede que suas chaves fiquem expostas publicamente no GitHub.

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// --- DIAGNÓSTICO DE DEBUG (Aparecerá no Console do Navegador) ---
// Verifique no Console (F12) se aparece "OK" ou "MISSING"
console.log("Status das Chaves Firebase:", {
  apiKey: firebaseConfig.apiKey ? "OK (Carregada)" : "MISSING (Faltando)",
  projectId: firebaseConfig.projectId ? "OK (Carregada)" : "MISSING (Faltando)",
  // Não mostramos a chave real por segurança, apenas se existe
});

// Inicialização com Tratamento de Erro
let app;
let auth;
let db;

try {
  // Validação básica antes de tentar iniciar
  if (!firebaseConfig.apiKey) {
    throw new Error("API Key do Firebase não encontrada. Verifique as variáveis de ambiente (VITE_FIREBASE_API_KEY).");
  }
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
} catch (error) {
  console.error("ERRO CRÍTICO AO INICIAR FIREBASE:", error);
  // Isso evita que o app quebre totalmente, permitindo ver o erro no console
}

export { auth, db };