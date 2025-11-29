import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- CONFIGURAÇÃO DO FIREBASE ---
// Tenta ler as variáveis de ambiente
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// --- DIAGNÓSTICO DE DEBUG (Visível no Console do Navegador) ---
console.group("Diagnóstico Firebase");
console.log("Tentando iniciar com Project ID:", projectId);
// Verificação de segurança da chave (mostra apenas os 4 primeiros caracteres ou aviso)
const keyPreview = apiKey ? `${apiKey.substring(0, 4)}...` : "NÃO DEFINIDA";
console.log("API Key detectada:", keyPreview);

// Verifica se a chave é o placeholder do exemplo (erro comum)
if (apiKey === "SUA_API_KEY_AQUI" || apiKey?.includes("SUA_API_KEY")) {
  console.error("ERRO CRÍTICO: Você esqueceu de substituir o texto de exemplo pela sua chave real no arquivo .env ou na Vercel.");
}
console.groupEnd();

// Inicialização com Tratamento de Erro
let app;
let auth;
let db;

try {
  // 1. Validação de existência
  if (!apiKey || !projectId) {
    throw new Error("Variáveis de ambiente ausentes. Verifique se o arquivo .env.local existe ou se as chaves foram adicionadas na Vercel.");
  }

  // 2. Validação de conteúdo inválido (Placeholder)
  if (apiKey.includes("SUA_API_KEY")) {
    throw new Error("A API Key ainda é o texto de exemplo. Configure as chaves reais.");
  }
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log("Firebase iniciado com sucesso!");
  
} catch (error) {
  console.error("FALHA AO INICIAR FIREBASE:", error.message);
  // Definimos como null para que o App.jsx saiba que falhou e não tente usar
  app = null;
  auth = null;
  db = null;
}

export { auth, db };