import React, { useState, useEffect } from 'react';
import { 
  Droplets, Sparkles, Car, CheckCircle, Clock, 
  ChevronRight, ShieldCheck, Plus, ArrowLeft, 
  LogOut, Star, AlertTriangle, Zap, CreditCard, 
  Wallet, QrCode, Sun, CloudRain, X, User,
  DollarSign, RefreshCcw, Lock, MessageCircle, Crown, Loader2, Phone, FileText, Settings, Key, Camera, Trash2, Save,
  Ticket, Calendar as CalendarIcon, Hash, Edit, ToggleLeft, ToggleRight
} from 'lucide-react';

// --- IMPORTAÇÕES DO FIREBASE ---
import { db, auth } from './firebase'; 
import { 
  collection, addDoc, updateDoc, doc, onSnapshot, 
  query, orderBy, serverTimestamp, where, getDoc, setDoc, deleteDoc, increment 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged, signInAnonymously, updatePassword 
} from 'firebase/auth';

// --- CONFIGURAÇÃO DE ACESSO ---
// ADICIONE AQUI OS EMAILS QUE DEVEM SER ADMIN
const ADMIN_EMAILS = [
  'alisson@teste.com', 
  'pamella@teste.com'
];

// --- DADOS DO MENU (Fallback inicial) ---
const INITIAL_MENU = [
  { id: 'simple', name: 'Ducha Rápida', price: 35, time: 20, icon: 'Droplets', desc: 'Externo + Pretinho (20min)' },
  { id: 'complete', name: 'Lavagem Americana', price: 60, time: 40, icon: 'Car', desc: 'Completa + Cera Líquida (40min)' },
  { id: 'detail', name: 'Higienização Interna', price: 150, time: 90, icon: 'Sparkles', desc: 'Bancos e Carpetes (1h30)' },
  { id: 'wax', name: 'Polimento Técnico', price: 250, time: 180, icon: 'Zap', desc: 'Proteção de Pintura (3h)' },
];

const PAYMENT_METHODS = [
  { id: 'pix', label: 'PIX', icon: <QrCode size={20} />, sub: 'Aprovação Imediata', promo: '-5%' },
  { id: 'credit', label: 'Crédito', icon: <CreditCard size={20} />, sub: '3x sem juros' },
  { id: 'debit', label: 'Débito', icon: <CreditCard size={20} />, sub: 'Sem juros' },
  { id: 'counter', label: 'No Balcão', icon: <Wallet size={20} />, sub: 'Dinheiro/Outros' },
];

// --- COMPONENTES AUXILIARES ---

const getIconComponent = (iconName, size = 20) => {
  switch(iconName) {
    case 'Droplets': return <Droplets size={size} />;
    case 'Car': return <Car size={size} />;
    case 'Sparkles': return <Sparkles size={size} />;
    case 'Zap': return <Zap size={size} />;
    default: return <Car size={size} />;
  }
};

const Toast = ({ notification }) => {
  if (!notification) return null;
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-toast px-6 py-3 rounded-full shadow-xl bg-slate-800 text-white flex items-center gap-2 w-max max-w-[90%]">
      <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
      <span className="text-sm font-bold truncate">{notification.msg}</span>
    </div>
  );
};

const TicketModal = ({ service, onClose, menuItems }) => {
  const sInfo = menuItems.find(s => s.id === service.serviceType) || {};
  const serviceName = service.serviceNameSnapshot || sInfo.name; 
  const isPaid = service.isPaid;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-toast">
      <div className="w-full max-w-sm relative">
        <button onClick={onClose} className="absolute -top-10 right-0 text-white bg-white/20 p-2 rounded-full"><X size={20}/></button>
        <div className="bg-cyan-500 p-6 rounded-t-2xl text-center ticket-rip text-white relative">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <CheckCircle className="text-cyan-500" size={32} />
           </div>
           <h2 className="text-2xl font-bold mb-1">{isPaid ? 'Recibo Digital' : 'Check-in Confirmado'}</h2>
           <p className="opacity-90 text-sm">{new Date(service.entryTime).toLocaleDateString()}</p>
        </div>
        <div className="bg-white p-6 rounded-b-2xl pt-8 shadow-2xl relative">
           <div className="text-center mb-6">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Código do Pedido</p>
              <p className="text-xl font-mono font-bold text-slate-800 tracking-wider truncate">#{service.id}</p>
           </div>
           <div className="space-y-3 border-t border-dashed border-slate-200 pt-4 mb-6">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Veículo</span><span className="font-bold text-slate-800 uppercase">{service.plate}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Serviço</span><span className="font-bold text-slate-800">{serviceName}</span></div>
              {service.discountApplied > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-bold">
                      <span>Cupom ({service.couponCode})</span>
                      <span>- R$ {service.discountApplied.toFixed(2)}</span>
                  </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t border-slate-100"><span className="text-slate-900 font-bold">Total</span><span className="font-bold text-slate-900 text-lg">R$ {service.price.toFixed(2)}</span></div>
           </div>
           <button onClick={onClose} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">Fechar</button>
        </div>
      </div>
    </div>
  );
};

const WeatherWidget = () => {
  const weather = { temp: 28, condition: 'sunny', text: 'Dia perfeito para lavar!' };
  return (
      <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-white/50 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-full">
                  {weather.condition === 'sunny' ? <Sun className="text-yellow-600" size={20} /> : <CloudRain className="text-blue-600" size={20} />}
              </div>
              <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Clima Atual</p>
                  <p className="font-bold text-slate-800 text-sm">{weather.temp}°C • {weather.text}</p>
              </div>
          </div>
      </div>
  );
};

// --- TELAS ---

const AuthScreen = ({ view, setView, onLogin, onRegister, onClientLogin, authError, setAuthError, loading }) => {
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [regName, setRegName] = useState('');
    const [regCpf, setRegCpf] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regModel, setRegModel] = useState('');
    const [regPlate, setRegPlate] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');

    return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[55%] bg-gradient-brand rounded-b-[3rem] shadow-2xl z-0"></div>
      <div className="bg-white p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-sm relative z-10 mt-10 animate-toast">
        <div className="w-20 h-20 bg-cyan-50 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-inner rotate-3">
          <Droplets className="text-cyan-500 w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 text-center mb-1 tracking-tight">Splash<span className="text-cyan-500">Auto</span></h1>
        <p className="text-slate-400 text-center text-sm mb-6 font-medium">
            {view === 'login' ? 'Acesse sua conta' : 'Crie sua conta gratuitamente'}
        </p>
        {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg text-center font-bold">{authError}</div>}
        {view === 'login' ? (
            <form onSubmit={(e) => { e.preventDefault(); onLogin(loginEmail, loginPassword); }} className="space-y-3">
                <input type="email" placeholder="Seu Email" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-cyan-500" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                <input type="password" placeholder="Sua Senha" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-cyan-500" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex justify-center gap-2 active:scale-95 disabled:opacity-70">
                    {loading ? <Loader2 className="animate-spin"/> : 'Entrar'}
                </button>
                <div className="text-center pt-4">
                    <p className="text-xs text-slate-400">Novo por aqui?</p>
                    <button type="button" onClick={() => { setView('register'); setAuthError(''); }} className="text-cyan-600 font-bold text-sm mt-1">Criar minha conta</button>
                </div>
            </form>
        ) : (
            <form onSubmit={(e) => { e.preventDefault(); onRegister({ name: regName, cpf: regCpf, phone: regPhone, model: regModel, plate: regPlate, email: regEmail, password: regPassword }); }} className="space-y-3">
                <div className="flex gap-2">
                    <input required placeholder="Nome" className="w-1/2 p-3 bg-slate-50 rounded-xl border outline-none focus:border-cyan-500 text-sm" value={regName} onChange={e => setRegName(e.target.value)} />
                    <input required placeholder="CPF" className="w-1/2 p-3 bg-slate-50 rounded-xl border outline-none focus:border-cyan-500 text-sm" value={regCpf} onChange={e => setRegCpf(e.target.value)} />
                </div>
                <div className="flex gap-2">
                    <input required placeholder="Modelo Carro" className="w-1/2 p-3 bg-slate-50 rounded-xl border outline-none focus:border-cyan-500 text-sm" value={regModel} onChange={e => setRegModel(e.target.value)} />
                    <input required placeholder="Placa" className="w-1/2 p-3 bg-slate-50 rounded-xl border outline-none focus:border-cyan-500 text-sm uppercase" value={regPlate} onChange={e => setRegPlate(e.target.value)} />
                </div>
                <input required placeholder="Celular (WhatsApp)" className="w-full p-3 bg-slate-50 rounded-xl border outline-none focus:border-cyan-500 text-sm" value={regPhone} onChange={e => setRegPhone(e.target.value)} />
                <input required type="email" placeholder="Email" className="w-full p-3 bg-slate-50 rounded-xl border outline-none focus:border-cyan-500 text-sm" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                <input required type="password" placeholder="Senha" className="w-full p-3 bg-slate-50 rounded-xl border outline-none focus:border-cyan-500 text-sm" value={regPassword} onChange={e => setRegPassword(e.target.value)} />
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex justify-center gap-2 active:scale-95 disabled:opacity-70">
                    {loading ? <Loader2 className="animate-spin"/> : 'Finalizar Cadastro'}
                </button>
                <button type="button" onClick={() => { setView('login'); setAuthError(''); }} className="w-full text-slate-400 text-xs py-2">
                    Já tenho conta, fazer login
                </button>
            </form>
        )}
      </div>
    </div>
  );
};

const ClientSettings = ({ userData, setView, onUpdateProfile, onUpdatePassword }) => {
    const [tab, setTab] = useState('profile');
    const [form, setForm] = useState({
        name: userData?.name || '',
        phone: userData?.phone || '',
        model: userData?.model || '',
        plate: userData?.plate || '',
    });
    const [pass, setPass] = useState('');

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="bg-white p-4 pt-8 sticky top-0 z-10 flex items-center gap-3 border-b border-slate-100">
                <button onClick={() => setView('client-home')} className="p-2 -ml-2 rounded-full hover:bg-slate-50"><ArrowLeft className="text-slate-600"/></button>
                <h2 className="font-bold text-lg text-slate-800">Configurações</h2>
            </header>

            <div className="p-6">
                <div className="flex bg-white p-1 rounded-xl mb-6 shadow-sm border border-slate-100">
                    <button onClick={() => setTab('profile')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'profile' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Meus Dados</button>
                    <button onClick={() => setTab('security')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'security' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Segurança</button>
                </div>

                {tab === 'profile' && (
                    <div className="space-y-4 animate-toast">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nome Completo</label>
                                <input className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-cyan-200" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">WhatsApp</label>
                                <input className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-cyan-200" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block flex items-center gap-1"><Car size={12}/> Modelo Principal</label>
                                <input className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-cyan-200" value={form.model} onChange={e => setForm({...form, model: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Placa</label>
                                <input className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-cyan-200 uppercase font-mono tracking-widest text-center" value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} />
                            </div>
                        </div>

                        <button onClick={() => onUpdateProfile(form)} className="w-full bg-cyan-500 text-white p-4 rounded-xl font-bold shadow-lg shadow-cyan-200 active:scale-95 transition-transform flex items-center justify-center gap-2">
                            Salvar Alterações
                        </button>
                    </div>
                )}

                {tab === 'security' && (
                    <div className="space-y-4 animate-toast">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block flex items-center gap-1"><Key size={12}/> Nova Senha</label>
                                <input type="password" placeholder="Mínimo 6 caracteres" className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-cyan-200" value={pass} onChange={e => setPass(e.target.value)} />
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 text-orange-700 text-xs flex gap-2">
                                <AlertTriangle size={16} className="flex-shrink-0"/>
                                <p>Por segurança, você pode precisar fazer login novamente após alterar a senha.</p>
                            </div>
                        </div>
                        <button onClick={() => onUpdatePassword(pass)} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold shadow-lg active:scale-95 transition-transform">
                            Atualizar Senha
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ClientHome = ({ userData, handleLogout, setView, activeServices, historyServices, setLastTicket }) => {
    const [tab, setTab] = useState('active');
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="bg-slate-900 text-white p-6 pt-12 pb-8 rounded-b-[2.5rem] relative z-0">
           <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Bem-vindo</p>
                <h2 className="text-2xl font-bold">{userData ? userData.name.split(' ')[0] : 'Cliente'}</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setView('client-settings')} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><Settings size={18}/></button>
                <button onClick={handleLogout} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><LogOut size={18}/></button>
              </div>
           </div>
           
           <div className="flex gap-2">
              <button onClick={() => setTab('active')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${tab === 'active' ? 'bg-cyan-500 text-white shadow-lg' : 'bg-white/10 text-slate-400'}`}>Ativos</button>
              <button onClick={() => setTab('history')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${tab === 'history' ? 'bg-cyan-500 text-white shadow-lg' : 'bg-white/10 text-slate-400'}`}>Histórico</button>
              <button className="flex-1 py-3 rounded-xl font-bold text-sm bg-white/5 text-yellow-400 border border-yellow-500/30 flex items-center justify-center gap-1 opacity-70"><Crown size={14}/> Clube</button>
           </div>
        </div>

        <div className="p-6 relative z-10 space-y-6">
           {tab === 'active' && (
             <>
                <WeatherWidget />
                <button onClick={() => setView('client-checkin')} className="w-full bg-gradient-brand text-white p-4 rounded-2xl font-bold shadow-lg shadow-cyan-200 flex items-center justify-center gap-3 active:scale-95 transition-transform">
                    <div className="bg-white/20 p-1 rounded-lg"><Plus size={20} /></div> Agendar Serviço
                </button>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-3 mt-2">Em Andamento</h3>
                    {activeServices.length === 0 ? (
                        <div className="text-center py-8 opacity-50"><p>Nenhum serviço ativo agora.</p></div>
                    ) : (
                        activeServices.map(service => (
                            <div key={service.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-3 flex items-center justify-between animate-toast">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-50 text-cyan-600"><Droplets size={24} /></div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{service.vehicleModel}</h4>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{service.status === 'queue' ? 'Na Fila' : 'Sendo Lavado'}</p>
                                </div>
                            </div>
                            <button onClick={() => setLastTicket(service)} className="text-cyan-600 text-xs font-bold underline">Ver Ticket</button>
                            </div>
                        ))
                    )}
                </div>
             </>
           )}

           {tab === 'history' && (
             <div className="space-y-4 animate-toast">
                {historyServices.length === 0 && <div className="text-center py-8 opacity-50"><p>Histórico vazio.</p></div>}
                {historyServices.map(service => (
                    <div key={service.id} onClick={() => setLastTicket(service)} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:border-cyan-200 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs text-slate-400 font-bold mb-1">{new Date(service.entryTime).toLocaleDateString()}</p>
                                <h4 className="font-bold text-slate-800">{service.serviceNameSnapshot}</h4>
                            </div>
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-lg">Finalizado</span>
                        </div>
                    </div>
                ))}
             </div>
           )}
        </div>
      </div>
    );
};

const ClientCheckIn = ({ userData, menuItems, coupons, setView, onSubmit, showToast }) => {
    const [form, setForm] = useState({ 
        name: userData?.name || '', 
        model: userData?.model || '', 
        plate: userData?.plate || '', 
        selectedService: null, 
        paymentMethod: null, 
        notes: '',
        entryPhotos: [],
        couponCode: '',
        couponId: null, // Guardar o ID do cupom para atualizar o uso
        appliedDiscount: 0
    });

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + form.entryPhotos.length > 3) return showToast('Máximo 3 fotos permitidas.', 'error');

        Promise.all(files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        })).then(images => {
            setForm(prev => ({...prev, entryPhotos: [...prev.entryPhotos, ...images] }));
        });
    };

    const removePhoto = (index) => {
        setForm(prev => ({...prev, entryPhotos: prev.entryPhotos.filter((_, i) => i !== index)}));
    };

    const handleApplyCoupon = () => {
        if (!form.couponCode) return;
        const code = form.couponCode.toUpperCase();
        const found = coupons.find(c => c.code === code);

        if (found) {
            // Check if active
            if (found.isActive === false) {
                showToast('Este cupom foi desativado.', 'error');
                setForm(prev => ({...prev, appliedDiscount: 0, couponId: null}));
                return;
            }

            // Validade por Data (até o final do dia)
            if (found.expiresAt) {
                const expirationDate = new Date(found.expiresAt + 'T23:59:59'); // Força final do dia
                if (expirationDate < new Date()) {
                    showToast('Este cupom expirou.', 'error');
                    setForm(prev => ({...prev, appliedDiscount: 0, couponId: null}));
                    return;
                }
            }

            // Validade por Quantidade de Usos
            if (found.maxUses && (found.usedCount || 0) >= parseInt(found.maxUses)) {
                showToast('Este cupom atingiu o limite de usos.', 'error');
                setForm(prev => ({...prev, appliedDiscount: 0, couponId: null}));
                return;
            }
            
            const service = menuItems.find(i => i.id === form.selectedService);
            if (!service) {
                showToast('Selecione um serviço primeiro.', 'error');
                return;
            }

            const discountValue = (service.price * found.discount) / 100;
            setForm(prev => ({...prev, appliedDiscount: discountValue, couponCode: code, couponId: found.id}));
            showToast(`Cupom ${code} aplicado: ${found.discount}% OFF!`);
        } else {
            showToast('Cupom inválido.', 'error');
            setForm(prev => ({...prev, appliedDiscount: 0, couponId: null}));
        }
    };

    const selectedServicePrice = menuItems.find(i => i.id === form.selectedService)?.price || 0;
    const finalPrice = Math.max(0, selectedServicePrice - form.appliedDiscount);

    return (
      <div className="min-h-screen bg-slate-50 pb-20">
         <header className="bg-white p-4 pt-8 sticky top-0 z-10 flex items-center gap-3 border-b border-slate-100">
            <button onClick={() => setView('client-home')} className="p-2 -ml-2 rounded-full hover:bg-slate-50"><ArrowLeft className="text-slate-600"/></button>
            <h2 className="font-bold text-lg text-slate-800">Novo Agendamento</h2>
         </header>
         <form onSubmit={(e) => { e.preventDefault(); if (!form.selectedService || !form.paymentMethod) return showToast('Preencha todos os campos!', 'error'); onSubmit(form); setView('client-home'); }} className="p-6 space-y-8 animate-toast">
            <section>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Car size={14}/> Veículo</h3>
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                  <input required placeholder="Modelo (ex: Honda Civic)" className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-cyan-200" value={form.model} onChange={e=>setForm({...form, model: e.target.value})} />
                  <div className="flex gap-3">
                     <input required placeholder="Placa" maxLength={8} className="w-1/2 p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-cyan-200 uppercase text-center font-mono" value={form.plate} onChange={e=>setForm({...form, plate: e.target.value})} />
                     <input required placeholder="Nome do Cliente" className="w-1/2 p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-cyan-200" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
                  </div>
               </div>
            </section>

            <section>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Camera size={14}/> Vistoria Visual</h3>
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                   <p className="text-xs text-slate-500 mb-3">Adicione fotos do estado atual do veículo (máx 3). Isso protege você e a loja.</p>
                   <div className="flex gap-2 overflow-x-auto pb-2">
                       <label className="w-20 h-20 bg-slate-50 border-2 border-dashed border-cyan-200 rounded-xl flex flex-col items-center justify-center text-cyan-600 cursor-pointer hover:bg-cyan-50 flex-shrink-0">
                           <Camera size={20} />
                           <span className="text-[10px] font-bold mt-1">Adicionar</span>
                           <input type="file" className="hidden" accept="image/*" multiple onChange={handlePhotoChange} />
                       </label>
                       {form.entryPhotos.map((photo, idx) => (
                           <div key={idx} className="relative w-20 h-20 flex-shrink-0 group">
                               <img src={photo} className="w-full h-full object-cover rounded-xl border border-slate-200" alt="vistoria" />
                               <button type="button" onClick={() => removePhoto(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-sm"><X size={12}/></button>
                           </div>
                       ))}
                   </div>
               </div>
            </section>

            <section>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Sparkles size={14}/> Escolha o Serviço</h3>
               <div className="grid grid-cols-1 gap-3">
                  {menuItems.map(item => (
                     <div key={item.id} onClick={() => setForm({...form, selectedService: item.id, appliedDiscount: 0, couponCode: '', couponId: null})} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${form.selectedService === item.id ? 'border-cyan-500 bg-cyan-50' : 'border-transparent bg-white shadow-sm'}`}>
                        <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-lg ${form.selectedService === item.id ? 'bg-cyan-200 text-cyan-800' : 'bg-slate-100 text-slate-400'}`}>{getIconComponent(item.icon)}</div>
                           <div><h4 className="font-bold text-slate-800 text-sm">{item.name}</h4><p className="text-[10px] text-slate-400">{item.desc}</p></div>
                        </div>
                        <span className="font-bold text-slate-700 text-sm">R$ {item.price}</span>
                     </div>
                  ))}
               </div>
            </section>
            <section>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Wallet size={14}/> Pagamento</h3>
               <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map(method => (
                     <div key={method.id} onClick={() => setForm({...form, paymentMethod: method.id})} className={`p-3 rounded-xl border-2 cursor-pointer relative ${form.paymentMethod === method.id ? 'border-cyan-500 bg-cyan-50' : 'border-transparent bg-white shadow-sm'}`}>
                        {method.promo && <span className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-bold px-1.5 rounded-bl-lg">{method.promo}</span>}
                        <div className={`mb-1 ${form.paymentMethod === method.id ? 'text-cyan-600' : 'text-slate-400'}`}>{method.icon}</div>
                        <p className="font-bold text-xs text-slate-800">{method.label}</p>
                     </div>
                  ))}
               </div>
               
               {/* COUPON SECTION */}
               <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <label className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Ticket size={12}/> Possui Cupom?</label>
                   <div className="flex gap-2">
                       <input 
                           className="flex-1 p-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-cyan-500 uppercase"
                           placeholder="Código (ex: APP10)"
                           value={form.couponCode}
                           onChange={e => setForm({...form, couponCode: e.target.value})}
                       />
                       <button type="button" onClick={handleApplyCoupon} className="bg-slate-800 text-white px-4 rounded-lg text-xs font-bold">Aplicar</button>
                   </div>
                   {form.appliedDiscount > 0 && (
                       <div className="mt-2 text-xs text-green-600 font-bold flex justify-between">
                           <span>Desconto aplicado:</span>
                           <span>- R$ {form.appliedDiscount.toFixed(2)}</span>
                       </div>
                   )}
               </div>
            </section>

            <div className="fixed bottom-0 left-0 w-full bg-white p-4 border-t border-slate-100 flex justify-between items-center shadow-lg z-20">
                <div>
                    <p className="text-xs text-slate-400 uppercase">Total a Pagar</p>
                    <p className="text-2xl font-bold text-slate-800">R$ {finalPrice.toFixed(2)}</p>
                </div>
                <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform">
                    Confirmar
                </button>
            </div>
            <div className="h-16"></div>
         </form>
      </div>
    );
};

const CouponsManager = ({ coupons, handleSaveCoupon, handleDeleteCoupon, handleUpdateCoupon, handleToggleCoupon }) => {
    const [form, setForm] = useState({ code: '', discount: '', expiresAt: '', maxUses: '' });
    const [editingId, setEditingId] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.code || !form.discount) return;
        
        if (editingId) {
            handleUpdateCoupon(editingId, form);
            setEditingId(null);
        } else {
            handleSaveCoupon(form);
        }
        setForm({ code: '', discount: '', expiresAt: '', maxUses: '' });
    };

    const startEdit = (coupon) => {
        setForm({ 
            code: coupon.code, 
            discount: coupon.discount, 
            expiresAt: coupon.expiresAt || '', 
            maxUses: coupon.maxUses || '' 
        });
        setEditingId(coupon.id);
    };

    const cancelEdit = () => {
        setForm({ code: '', discount: '', expiresAt: '', maxUses: '' });
        setEditingId(null);
    };

    const formatDateDisplay = (dateString) => {
        if (!dateString) return 'Sem validade';
        const [y, m, d] = dateString.split('-');
        return `Válido até ${d}/${m}/${y}`;
    }

    return (
        <div className="space-y-6 animate-toast">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        {editingId ? <Edit size={16}/> : <Plus size={16}/>} 
                        {editingId ? 'Editar Cupom' : 'Novo Cupom'}
                    </h3>
                    {editingId && <button onClick={cancelEdit} className="text-xs text-red-500 font-bold">Cancelar</button>}
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] text-slate-400 uppercase font-bold">Código</label>
                            <input className="w-full p-2 border-b border-slate-200 outline-none focus:border-cyan-500 uppercase font-mono font-bold" 
                                value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="APP10" />
                        </div>
                        <div className="w-24">
                            <label className="text-[10px] text-slate-400 uppercase font-bold">Desc. (%)</label>
                            <input type="number" className="w-full p-2 border-b border-slate-200 outline-none focus:border-cyan-500" 
                                value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} placeholder="10" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] text-slate-400 uppercase font-bold">Validade (Data)</label>
                            <input type="date" className="w-full p-2 border-b border-slate-200 outline-none focus:border-cyan-500 text-slate-600" 
                                value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} />
                        </div>
                        <div className="w-24">
                            <label className="text-[10px] text-slate-400 uppercase font-bold">Máx. Usos</label>
                            <input type="number" className="w-full p-2 border-b border-slate-200 outline-none focus:border-cyan-500" 
                                value={form.maxUses} onChange={e => setForm({...form, maxUses: e.target.value})} placeholder="∞" />
                        </div>
                    </div>
                    <button type="submit" className={`w-full text-white py-2 rounded-lg font-bold text-sm mt-2 transition-colors ${editingId ? 'bg-slate-800 hover:bg-slate-900' : 'bg-cyan-500 hover:bg-cyan-600'}`}>
                        {editingId ? 'Salvar Alterações' : 'Criar Cupom'}
                    </button>
                </form>
            </div>

            <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase ml-1">Cupons Ativos</h3>
                {coupons.map(coupon => (
                    <div key={coupon.id} className={`bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center transition-all ${coupon.isActive === false ? 'border-slate-100 opacity-60' : 'border-green-100'}`}>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold text-lg ${coupon.isActive === false ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{coupon.code}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${coupon.isActive === false ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'}`}>-{coupon.discount}%</span>
                            </div>
                            <div className="flex gap-3 mt-1 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                    <CalendarIcon size={10} /> 
                                    {formatDateDisplay(coupon.expiresAt)}
                                </span>
                                {coupon.maxUses && (
                                    <span className="flex items-center gap-1">
                                        <Hash size={10} /> 
                                        {coupon.usedCount || 0}/{coupon.maxUses} usados
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <button onClick={() => handleToggleCoupon(coupon.id, coupon.isActive)} className="p-2 hover:bg-slate-50 rounded-full" title={coupon.isActive === false ? "Ativar" : "Desativar"}>
                                {coupon.isActive === false ? <ToggleLeft size={20} className="text-slate-300"/> : <ToggleRight size={20} className="text-green-500"/>}
                             </button>
                             <button onClick={() => startEdit(coupon)} className="p-2 hover:bg-blue-50 rounded-full text-blue-400" title="Editar">
                                <Edit size={18} />
                             </button>
                             <button onClick={() => handleDeleteCoupon(coupon.id)} className="text-red-400 p-2 hover:bg-red-50 rounded-full" title="Excluir">
                                <Trash2 size={18} />
                             </button>
                        </div>
                    </div>
                ))}
                {coupons.length === 0 && <p className="text-center text-xs text-slate-300 py-4">Nenhum cupom criado.</p>}
            </div>
        </div>
    );
};

const AdminDashboard = ({ handleLogout, services, setSelectedServiceId, setView, menuItems, updateMenuItem, handleSaveMenu, coupons, handleSaveCoupon, handleDeleteCoupon, handleUpdateCoupon, handleToggleCoupon }) => {
    const [adminTab, setAdminTab] = useState('dashboard');
    const paidServices = services.filter(s => s.isPaid);
    const totalRevenue = paidServices.reduce((acc, curr) => acc + curr.price, 0);

    return (
      <div className="min-h-screen bg-slate-100">
         <header className="bg-slate-900 text-white p-6 pt-10 pb-8 rounded-b-[2rem] shadow-lg sticky top-0 z-10">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="text-cyan-400"/> Painel</h2>
               <button onClick={handleLogout} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><LogOut size={18}/></button>
            </div>
            <div className="flex bg-slate-800 p-1 rounded-xl mb-4 overflow-x-auto">
                <button onClick={() => setAdminTab('dashboard')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold whitespace-nowrap ${adminTab === 'dashboard' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Pátio</button>
                <button onClick={() => setAdminTab('config')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold whitespace-nowrap ${adminTab === 'config' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Menu</button>
                <button onClick={() => setAdminTab('coupons')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold whitespace-nowrap ${adminTab === 'coupons' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Cupons</button>
            </div>
            {adminTab === 'dashboard' && (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex justify-between items-center animate-toast">
                    <div><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Caixa (Confirmado)</p><p className="text-3xl font-bold text-green-400">R$ {totalRevenue.toFixed(2)}</p></div>
                    <div className="bg-green-500/20 p-2 rounded-lg"><DollarSign className="text-green-400" size={32} /></div>
                </div>
            )}
         </header>
         <div className="p-4 space-y-4 pb-20">
            {adminTab === 'dashboard' && (
                <>
                <div className="flex justify-between items-center px-2 mt-2"><h3 className="font-bold text-slate-600 text-sm uppercase tracking-wider">Pátio Ativo</h3><span className="text-xs bg-white px-2 py-1 rounded-lg font-bold text-slate-500 shadow-sm">{services.length} Veículos</span></div>
                {services.map(service => (
                   <div key={service.id} onClick={() => { setSelectedServiceId(service.id); setView('admin-detail'); }} className={`bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center cursor-pointer transition-colors animate-toast ${service.isPaid ? 'border-slate-200 hover:border-cyan-300' : 'border-orange-200 hover:border-orange-400'}`}>
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${service.status === 'finished' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{service.status === 'queue' ? 'F' : service.status === 'washing' ? 'L' : 'OK'}</div>
                         <div><h4 className="font-bold text-slate-800 text-sm">{service.vehicleModel}</h4><p className="text-xs text-slate-500 uppercase">{service.plate}</p></div>
                      </div>
                      <div className="text-right"><span className="block font-bold text-slate-800 text-sm">R$ {service.price.toFixed(2)}</span><span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${service.isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{service.isPaid ? 'PAGO' : 'BALCÃO'}</span></div>
                   </div>
                ))}
                </>
            )}
            {adminTab === 'config' && (
                <div className="space-y-4 animate-toast">
                    {menuItems.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                             <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3"><div className="bg-slate-100 p-2 rounded-lg text-slate-500">{getIconComponent(item.icon)}</div><input className="font-bold text-slate-800 outline-none border-b border-transparent focus:border-cyan-500 flex-1" value={item.name} onChange={(e) => updateMenuItem(item.id, 'name', e.target.value)} /></div>
                             <div className="space-y-3">
                                 <div>
                                    <label className="text-[10px] text-slate-400 uppercase font-bold">Descrição do Serviço</label>
                                    <textarea className="w-full text-sm text-slate-600 outline-none border-b border-slate-100 focus:border-cyan-500 py-1 resize-none" value={item.desc} onChange={(e) => updateMenuItem(item.id, 'desc', e.target.value)} />
                                 </div>
                                 <div className="flex gap-4">
                                     <div className="flex-1">
                                        <label className="text-[10px] text-slate-400 uppercase font-bold">Preço (R$)</label>
                                        <input type="number" className="w-full font-bold text-slate-800 outline-none border-b border-slate-100 focus:border-cyan-500 py-1" value={item.price} onChange={(e) => updateMenuItem(item.id, 'price', e.target.value)} />
                                     </div>
                                 </div>
                             </div>
                        </div>
                    ))}
                    <button onClick={handleSaveMenu} className="fixed bottom-6 right-6 bg-slate-900 text-white p-4 rounded-full shadow-xl z-20 animate-bounce">
                        <Save size={24} />
                    </button>
                </div>
            )}
            {adminTab === 'coupons' && (
                <CouponsManager coupons={coupons} handleSaveCoupon={handleSaveCoupon} handleDeleteCoupon={handleDeleteCoupon} handleUpdateCoupon={handleUpdateCoupon} handleToggleCoupon={handleToggleCoupon} />
            )}
         </div>
      </div>
    );
};

const AdminDetail = ({ service, setView, togglePaymentStatus, updateStatus }) => {
    if (!service) return null;
    const isCounterPayment = service.paymentMethod === 'counter';
    const handleWhatsApp = () => {
        if (!service.clientPhone) return alert('Cliente sem telefone cadastrado.');
        const message = `Olá ${service.clientName}, seu veículo ${service.vehicleModel} (${service.plate}) está pronto! Pode vir buscar.`;
        const url = `https://wa.me/55${service.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
       <div className="min-h-screen bg-white">
          <header className="p-4 pt-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20">
             <button onClick={() => setView('admin-home')} className="p-2 -ml-2 rounded-full hover:bg-slate-50"><ArrowLeft className="text-slate-700"/></button>
             <h2 className="font-bold text-slate-800">OS #{service.id.slice ? service.id.slice(0,6) : service.id}</h2>
             <div className="w-8"></div>
          </header>
          <div className="p-6 space-y-6">
             <div className="text-center"><h1 className="text-2xl font-bold text-slate-900">{service.vehicleModel}</h1><p className="text-lg font-mono text-slate-500 uppercase tracking-widest">{service.plate}</p><div className="mt-2 text-sm text-slate-500 flex items-center justify-center gap-1"><User size={14}/> {service.clientName}</div></div>
             
             {/* Vistoria Photos Display */}
             {service.entryPhotos && service.entryPhotos.length > 0 && (
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Camera size={12}/> Vistoria de Entrada</p>
                     <div className="flex gap-2 overflow-x-auto">
                         {service.entryPhotos.map((photo, idx) => (
                             <img key={idx} src={photo} className="w-20 h-20 rounded-lg object-cover border border-slate-200" alt="vistoria" />
                         ))}
                     </div>
                 </div>
             )}

             <div className={`p-4 rounded-xl border-2 ${service.isPaid ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex justify-between items-center mb-4"><span className="text-sm font-bold uppercase tracking-wider text-slate-500">Financeiro</span><span className={`text-xs font-bold px-2 py-1 rounded uppercase ${service.isPaid ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'}`}>{service.isPaid ? 'Confirmado' : 'Aguardando'}</span></div>
                <div className="flex justify-between items-center mb-4"><span className="text-slate-600">Total</span><span className="text-xl font-bold text-slate-900">R$ {service.price.toFixed(2)}</span></div>
                {isCounterPayment ? ( <button onClick={() => togglePaymentStatus(service.id, service.isPaid)} className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${service.isPaid ? 'bg-white border border-slate-200 text-slate-500' : 'bg-slate-900 text-white shadow-lg'}`}>{service.isPaid ? <><RefreshCcw size={16}/> Reabrir Cobrança</> : <><CheckCircle size={16}/> Confirmar Recebimento (Balcão)</>}</button> ) : ( <div className="w-full py-3 bg-green-100 text-green-800 rounded-lg font-bold text-sm flex items-center justify-center gap-2"><Lock size={16} /> Pago via {service.paymentMethod?.toUpperCase()}</div> )}
             </div>
             <button className="w-full py-3 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200" onClick={handleWhatsApp}><MessageCircle size={20} /> Notificar {service.clientName.split(' ')[0]} via WhatsApp</button>
             <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => updateStatus(service.id, 'washing')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${service.status === 'washing' ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-100 text-slate-400'}`}><Droplets size={24}/> <span className="font-bold text-sm">Lavando</span></button>
                <button onClick={() => updateStatus(service.id, 'finished')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${service.status === 'finished' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 text-slate-400'}`}><CheckCircle size={24}/> <span className="font-bold text-sm">Pronto</span></button>
             </div>
          </div>
       </div>
    );
};

export default function App() {
  const [user, setUser] = useState(null); 
  const [userData, setUserData] = useState(null); 
  const [isAdmin, setIsAdmin] = useState(false); 
  const [view, setView] = useState('login'); 
  const [services, setServices] = useState([]); 
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState(INITIAL_MENU);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [lastTicket, setLastTicket] = useState(null);
  const [authError, setAuthError] = useState('');

  const styles = `
    .bg-gradient-brand { background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); }
    .ticket-rip {
      background-image: radial-gradient(circle at bottom, transparent 6px, #ffffff 6px);
      background-size: 16px 10px;
      background-position: bottom;
      background-repeat: repeat-x;
    }
    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .animate-toast { animation: slideIn 0.3s ease-out forwards; }
  `;

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const adminCheck = ADMIN_EMAILS.includes(currentUser.email); // USO DA LISTA DE ADMINS
        setIsAdmin(adminCheck);
        if (!adminCheck) {
            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) setUserData(userDoc.data());
            } catch (error) { console.error("Erro ao buscar perfil:", error); }
        }
        setView(adminCheck ? 'admin-home' : 'client-home');
      } else {
        setView('login');
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Menu
  useEffect(() => {
    if (!db) return;
    const fetchMenu = async () => {
        try {
            const docRef = doc(db, 'settings', 'menu');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().items) {
                setMenuItems(docSnap.data().items);
            }
        } catch (e) { console.log('Usando menu padrão'); }
    };
    fetchMenu();
  }, []);

  // Fetch Coupons
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'coupons'), orderBy('code'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const couponsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCoupons(couponsData);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Services
  useEffect(() => {
    if (!user || !db) return;
    try {
      let q;
      if (isAdmin) {
        q = query(collection(db, 'services'), orderBy('entryTime', 'desc'));
      } else {
        q = query(collection(db, 'services'), where('userId', '==', user.uid));
      }
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const servicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          entryTime: doc.data().entryTime?.toDate ? doc.data().entryTime.toDate().toISOString() : new Date().toISOString()
        }));
        
        servicesData.sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));
        
        setServices(servicesData);
      });
      return () => unsubscribe();
    } catch (e) { console.log("Erro na conexão:", e); }
  }, [user, isAdmin]);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = async (email, password) => {
    setLoading(true); setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error(error); setAuthError('Email ou senha inválidos.'); setLoading(false);
    }
  };

  const handleRegister = async (formData) => {
    setLoading(true); setAuthError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: formData.name, cpf: formData.cpf, phone: formData.phone,
          model: formData.model, plate: formData.plate.toUpperCase(),
          email: formData.email, createdAt: serverTimestamp()
      });
      showToast('Cadastro realizado!');
    } catch (error) {
      console.error(error);
      setAuthError(error.code === 'auth/email-already-in-use' ? 'Email já cadastrado.' : 'Erro ao cadastrar.');
      setLoading(false);
    }
  };

  const handleClientLogin = async () => {};

  const handleLogout = async () => {
    await signOut(auth);
    setView('login');
  };

  const submitCheckIn = async (form) => {
    const serviceInfo = menuItems.find(i => i.id === form.selectedService);
    const autoPaid = form.paymentMethod !== 'counter';
    const finalPrice = Math.max(0, serviceInfo.price - (form.appliedDiscount || 0));

    const newService = {
      userId: user.uid, clientName: form.name, clientPhone: userData?.phone || '',
      vehicleModel: form.model, plate: form.plate.toUpperCase(),
      serviceType: form.selectedService, serviceNameSnapshot: serviceInfo.name,
      paymentMethod: form.paymentMethod, isPaid: autoPaid, status: 'queue',
      entryTime: serverTimestamp(), price: finalPrice, 
      entryPhotos: form.entryPhotos, 
      notes: form.notes,
      couponCode: form.couponCode,
      discountApplied: form.appliedDiscount || 0
    };
    try {
      const docRef = await addDoc(collection(db, 'services'), newService);
      
      // Update coupon usage if applicable
      if (form.couponId) {
          await updateDoc(doc(db, 'coupons', form.couponId), {
              usedCount: increment(1)
          });
      }

      setLastTicket({ ...newService, id: docRef.id, entryTime: new Date().toISOString() });
      showToast(autoPaid ? 'Check-in realizado! Pago.' : 'Check-in realizado! Pagar no balcão.');
    } catch (error) { console.error("Erro ao salvar:", error); showToast('Erro ao salvar.', 'error'); }
  };

  const updateStatus = async (id, newStatus) => {
    try { await updateDoc(doc(db, 'services', id), { status: newStatus }); showToast('Status atualizado!'); } catch (error) { console.error(error); }
  };

  const togglePaymentStatus = async (id, currentStatus) => {
    try { await updateDoc(doc(db, 'services', id), { isPaid: !currentStatus }); showToast(!currentStatus ? 'Pago.' : 'Estornado.'); } catch (error) { console.error(error); }
  };

  const updateMenuItem = (id, field, value) => {
    setMenuItems(menuItems.map(item => item.id === id ? { ...item, [field]: field === 'price' ? Number(value) : value } : item));
  };

  const handleSaveMenu = async () => {
      try {
          await setDoc(doc(db, 'settings', 'menu'), { items: menuItems });
          showToast('Menu salvo com sucesso!');
      } catch (e) { console.error(e); showToast('Erro ao salvar menu', 'error'); }
  };

  const handleSaveCoupon = async (couponData) => {
      try {
          await addDoc(collection(db, 'coupons'), {
              ...couponData,
              usedCount: 0,
              isActive: true // Default active
          });
          showToast('Cupom criado com sucesso!');
      } catch(e) { showToast('Erro ao criar cupom', 'error'); }
  };

  const handleUpdateCoupon = async (id, data) => {
    try {
        await updateDoc(doc(db, 'coupons', id), data);
        showToast('Cupom atualizado!');
    } catch (e) { showToast('Erro ao atualizar', 'error'); }
  };

  const handleToggleCoupon = async (id, currentStatus) => {
    try {
        // Se currentStatus for undefined (legado), assume true, então inverte para false
        const newStatus = currentStatus === undefined ? false : !currentStatus;
        await updateDoc(doc(db, 'coupons', id), { isActive: newStatus });
        showToast(newStatus ? 'Cupom ativado!' : 'Cupom pausado.');
    } catch (e) { showToast('Erro ao alterar status', 'error'); }
  };

  const handleDeleteCoupon = async (id) => {
      try {
          await deleteDoc(doc(db, 'coupons', id));
          showToast('Cupom removido.');
      } catch(e) { showToast('Erro ao remover cupom', 'error'); }
  };

  const handleUpdateProfile = async (newData) => {
      try {
          await updateDoc(doc(db, 'users', user.uid), newData);
          setUserData(prev => ({...prev, ...newData}));
          showToast('Dados atualizados!');
      } catch(e) { showToast('Erro ao salvar dados', 'error'); }
  };

  const handleUpdatePassword = async (newPass) => {
      if(newPass.length < 6) return showToast('A senha deve ter no mínimo 6 caracteres', 'error');
      try {
          await updatePassword(user, newPass);
          showToast('Senha atualizada! Faça login novamente.');
          setTimeout(handleLogout, 2000);
      } catch(e) { showToast('Erro: Faça login novamente e tente de novo.', 'error'); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-cyan-500" size={40}/></div>;

  return (
    <div className="font-sans antialiased text-slate-900 max-w-md mx-auto bg-white min-h-screen shadow-2xl relative overflow-hidden selection:bg-cyan-200">
      <style>{styles}</style>
      <Toast notification={notification} />
      {lastTicket && <TicketModal service={lastTicket} onClose={() => setLastTicket(null)} menuItems={menuItems} />}
      
      {view === 'login' && <AuthScreen view={view} setView={setView} onLogin={handleLogin} onClientLogin={handleClientLogin} authError={authError} setAuthError={setAuthError} loading={loading} />}
      {view === 'register' && <AuthScreen view={view} setView={setView} onRegister={handleRegister} authError={authError} setAuthError={setAuthError} loading={loading} />}
      
      {view === 'client-home' && <ClientHome userData={userData} handleLogout={handleLogout} setView={setView} activeServices={services.filter(s => s.status !== 'finished')} historyServices={services.filter(s => s.status === 'finished')} setLastTicket={setLastTicket} />}
      
      {view === 'client-checkin' && <ClientCheckIn userData={userData} menuItems={menuItems} coupons={coupons} setView={setView} onSubmit={submitCheckIn} showToast={showToast} />}
      
      {view === 'client-settings' && <ClientSettings userData={userData} setView={setView} onUpdateProfile={handleUpdateProfile} onUpdatePassword={handleUpdatePassword} />}

      {view === 'admin-home' && <AdminDashboard handleLogout={handleLogout} services={services} setSelectedServiceId={setSelectedServiceId} setView={setView} menuItems={menuItems} updateMenuItem={updateMenuItem} handleSaveMenu={handleSaveMenu} coupons={coupons} handleSaveCoupon={handleSaveCoupon} handleDeleteCoupon={handleDeleteCoupon} handleUpdateCoupon={handleUpdateCoupon} handleToggleCoupon={handleToggleCoupon} />}
      
      {view === 'admin-detail' && <AdminDetail service={services.find(s => s.id === selectedServiceId)} setView={setView} togglePaymentStatus={togglePaymentStatus} updateStatus={updateStatus} />}
    </div>
  );
}