
import React, { useState } from 'react';
import { 
  auth, 
  googleProvider 
} from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { 
  Mail, 
  Lock, 
  UserPlus, 
  LogIn, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  ArrowRight,
  Calculator
} from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(userCredential.user);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        onAuthSuccess(userCredential.user);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') setError('Usuário não encontrado.');
      else if (err.code === 'auth/wrong-password') setError('Senha incorreta.');
      else if (err.code === 'auth/email-already-in-use') setError('E-mail já cadastrado.');
      else if (err.code === 'auth/weak-password') setError('Senha muito fraca (mínimo 6 caracteres).');
      else setError('Erro ao autenticar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle();
        
        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          const userCredential = await signInWithCredential(auth, credential);
          onAuthSuccess(userCredential.user);
        } else {
          setError('Erro: Token do Google não recebido.');
        }
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        onAuthSuccess(result.user);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setError('Erro ao entrar com Google: ' + (err.message || 'Erro desconhecido no dispositivo.'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Informe seu e-mail para recuperar a senha.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      setError('Erro ao enviar e-mail: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/30 mb-5 relative group">
             <Calculator className="w-10 h-10 text-white transform group-hover:scale-110 transition-transform duration-300" />
             <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
            PREÇO <span className="text-blue-600">PRO</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
            Gestão inteligente de custos para calçados
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="p-8">
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl mb-8">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${isLogin ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                Entrar
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${!isLogin ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                Cadastrar
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">E-mail Corporativo</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@empresa.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl pl-12 pr-4 py-4 text-sm outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Senha de Acesso</label>
                  {isLogin && (
                    <button 
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl pl-12 pr-4 py-4 text-sm outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold animate-in fade-in zoom-in">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {message && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in zoom-in">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <p>{message}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-[12px] uppercase tracking-[3px] py-4 rounded-2xl shadow-xl shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-3"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLogin ? (
                  <> <LogIn className="w-5 h-5" /> Entrar Agora </>
                ) : (
                  <> <UserPlus className="w-5 h-5" /> Criar Conta </>
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                <span className="bg-white dark:bg-slate-900 px-4 text-slate-400">Ou continuar com</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm py-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
              Google
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/50 p-6 text-center border-t border-slate-100 dark:border-slate-800">
             <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
               Protegido por Firebase Firestore Cloud Security.
             </p>
          </div>
        </div>

        <div className="mt-8 text-center flex items-center justify-center gap-6">
           <img src="https://lh3.googleusercontent.com/COxitqSboS1id6mSext-GP0_YH_798tA6fE0O2Y48A7UuE-261MIdwYF1M97_Y9zR-1e=s180-rw" className="w-10 grayscale opacity-40 hover:opacity-100 transition-opacity" alt="Clover" />
           <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[2px]">Industrial Softwares</p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
