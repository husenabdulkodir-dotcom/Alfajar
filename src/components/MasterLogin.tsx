import React, { useState, useEffect } from 'react';
import { Lock, Fingerprint, ShieldCheck, AlertCircle, KeyRound, User, Eye, EyeOff } from 'lucide-react';

interface MasterLoginProps {
  onLoginSuccess: () => void;
}

export const MasterLogin: React.FC<MasterLoginProps> = ({ onLoginSuccess }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isRegisteringBiometric, setIsRegisteringBiometric] = useState(false);

  // Hardcoded master credentials for demo purposes
  const MASTER_ID = 'alfajar';
  const MASTER_PASS = '121299';

  useEffect(() => {
    // Check if WebAuthn (biometrics) is supported and available
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          setIsBiometricAvailable(available);
        })
        .catch(() => setIsBiometricAvailable(false));
    }
  }, []);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (id === MASTER_ID && password === MASTER_PASS) {
      setError('');
      onLoginSuccess();
    } else {
      setError('ID atau Password salah.');
    }
  };

  const bufferToBase64 = (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  };

  const base64ToBuffer = (base64: string): ArrayBuffer => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const generateRandomBuffer = (length: number): ArrayBuffer => {
    const randomBytes = new Uint8Array(length);
    window.crypto.getRandomValues(randomBytes);
    return randomBytes.buffer;
  };

  const handleBiometricAuth = async () => {
    setError('');
    
    // Check if user has registered a biometric credential before
    const savedCredentialId = localStorage.getItem('master_biometric_id');

    if (!savedCredentialId) {
      // 1. Registration flow (first time using fingerprint)
      try {
        setIsRegisteringBiometric(true);
        const challenge = generateRandomBuffer(32);
        const userId = generateRandomBuffer(16);

        const publicKey: PublicKeyCredentialCreationOptions = {
          challenge,
          rp: {
            name: "Al Fajar Islamic School Portal",
            id: window.location.hostname
          },
          user: {
            id: userId,
            name: MASTER_ID,
            displayName: "Master Admin"
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 }, // ES256
            { type: "public-key", alg: -257 } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform", // Force platform authenticator (TouchID, FaceID, Windows Hello)
            userVerification: "required" // Require actual biometric/PIN verification
          },
          timeout: 60000,
          attestation: "none"
        };

        const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;
        
        if (credential) {
          // Save the rawId to local storage so we can verify it next time
          localStorage.setItem('master_biometric_id', bufferToBase64(credential.rawId));
          // Once registered, successfully log in
          onLoginSuccess();
        }
      } catch (err: any) {
        console.error(err);
        if (err.name === 'NotAllowedError') {
          setError('Akses sidik jari dibatalkan atau tidak diizinkan.');
        } else {
          setError('Gagal mendaftarkan sidik jari. Perangkat mungkin tidak mendukung.');
        }
      } finally {
        setIsRegisteringBiometric(false);
      }
    } else {
      // 2. Verification flow (subsequent logins)
      try {
        const challenge = generateRandomBuffer(32);
        
        const publicKey: PublicKeyCredentialRequestOptions = {
          challenge,
          rpId: window.location.hostname,
          allowCredentials: [
            {
              type: "public-key",
              id: base64ToBuffer(savedCredentialId),
              transports: ["internal"] // internal means platform authenticator
            }
          ],
          userVerification: "required",
          timeout: 60000
        };

        const assertion = await navigator.credentials.get({ publicKey });
        
        if (assertion) {
          onLoginSuccess();
        }
      } catch (err: any) {
        console.error(err);
        if (err.name === 'NotAllowedError') {
          setError('Autentikasi sidik jari dibatalkan.');
        } else {
          setError('Gagal memverifikasi sidik jari.');
        }
      }
    }
  };

  const hasRegisteredFingerprint = !!localStorage.getItem('master_biometric_id');

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 antialiased relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-emerald-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Kesiswaan & BK</h1>
          <p className="text-sm text-slate-400 mt-1">Al Fajar Islamic School</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-red-400 text-sm animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        <form onSubmit={handleManualLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 pl-1">ID Pengguna</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                value={id}
                onChange={(e) => {
                  setId(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                placeholder="Masukkan ID"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 pl-1">Kata Sandi</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-xl pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                placeholder="Masukkan Kata Sandi"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] mt-2"
          >
            Masuk Portal
          </button>
        </form>

        {isBiometricAvailable && (
          <>
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-slate-700"></div>
              <span className="px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Atau</span>
              <div className="flex-1 border-t border-slate-700"></div>
            </div>

            <button
              type="button"
              onClick={handleBiometricAuth}
              disabled={isRegisteringBiometric}
              className="w-full flex items-center justify-center gap-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98]"
            >
              <Fingerprint className={`w-5 h-5 ${isRegisteringBiometric ? 'animate-pulse text-emerald-400' : 'text-slate-300'}`} />
              <span>
                {isRegisteringBiometric 
                  ? 'Menunggu Sidik Jari...' 
                  : hasRegisteredFingerprint 
                    ? 'Masuk dengan Sidik Jari' 
                    : 'Daftarkan Sidik Jari'}
              </span>
            </button>
          </>
        )}

        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-500">Sistem Informasi Poin & Pelanggaran Santri</p>
          <p className="text-[10px] text-slate-500">Strict Privacy Protocol Enabled</p>
        </div>
      </div>
    </div>
  );
};
