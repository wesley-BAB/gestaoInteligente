import React from 'react';
import { LogOut, FileText, User, Settings, PieChart, Home, X, Pin, PinOff, Users, FileSignature, UserCog } from 'lucide-react';

export type ViewType = 'home' | 'contracts' | 'clients' | 'users' | 'service-types' | 'revenue' | 'profile';

interface SidebarProps {
  onLogout: () => void;
  activeView: ViewType;
  onChangeView: (view: ViewType) => void;
  isOpen: boolean;
  toggle: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout, activeView, onChangeView, isOpen, toggle, isPinned, onTogglePin }) => {
  
  // Logic: Text is visible if Sidebar is Open (Mobile) OR Pinned (Desktop) OR Hovered (Desktop)
  const getTextClass = () => {
    if (isOpen) return 'opacity-100'; // Always show on mobile/open
    return isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100';
  };

  const navItemClass = (view: ViewType) => `
    w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-medium whitespace-nowrap overflow-hidden relative
    ${activeView === view 
      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
      : 'text-gray-500 hover:bg-primary-50 hover:text-primary-600'
    }
  `;

  // Determine width classes based on pinned state
  const containerClasses = `
    fixed top-0 h-screen bg-white border-r border-gray-100 flex flex-col z-40 transition-all duration-300 ease-in-out
    ${isOpen ? 'translate-x-0 shadow-2xl w-64' : '-translate-x-full md:translate-x-0 md:shadow-none'}
    ${isPinned ? 'md:w-64' : 'md:w-20 md:hover:w-64 group'}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={toggle}
        ></div>
      )}

      {/* Sidebar Container */}
      <div className={containerClasses}>
        <div className="p-5 pb-4 flex flex-col items-center md:items-start transition-all">
          <div className="flex items-center gap-3 w-full overflow-hidden">
             <div className="h-10 w-10 min-w-[2.5rem] bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 shrink-0">
                 <FileSignature className="text-white w-6 h-6" />
             </div>
             <div className={`transition-opacity duration-300 whitespace-nowrap ${getTextClass()}`}>
                <h1 className="text-xl font-bold text-gray-800 tracking-tight leading-none">WES</h1>
                <p className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">Gestão</p>
             </div>
             
             {/* Mobile Close */}
             <button onClick={toggle} className="md:hidden text-gray-400 ml-auto">
                <X className="w-6 h-6" />
             </button>

             {/* Desktop Pin Toggle */}
             <button 
                onClick={onTogglePin} 
                className={`hidden md:block ml-auto text-gray-400 hover:text-primary-500 transition-colors ${getTextClass()}`}
                title={isPinned ? "Desfixar menu" : "Fixar menu"}
             >
                {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
             </button>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
          <button onClick={() => { onChangeView('home'); if(window.innerWidth < 768) toggle(); }} className={navItemClass('home')} title="Início">
            <Home className="w-6 h-6 min-w-[1.5rem] shrink-0" />
            <span className={`transition-opacity duration-200 delay-75 ${getTextClass()}`}>Início</span>
          </button>
          
          <button onClick={() => { onChangeView('contracts'); if(window.innerWidth < 768) toggle(); }} className={navItemClass('contracts')} title="Contratos">
            <FileText className="w-6 h-6 min-w-[1.5rem] shrink-0" />
            <span className={`transition-opacity duration-200 delay-75 ${getTextClass()}`}>Contratos & Avulsos</span>
          </button>

          <button onClick={() => { onChangeView('revenue'); if(window.innerWidth < 768) toggle(); }} className={navItemClass('revenue')} title="Provisão">
            <PieChart className="w-6 h-6 min-w-[1.5rem] shrink-0" />
            <span className={`transition-opacity duration-200 delay-75 ${getTextClass()}`}>Provisão Receita</span>
          </button>

          <button onClick={() => { onChangeView('clients'); if(window.innerWidth < 768) toggle(); }} className={navItemClass('clients')} title="Clientes">
            <Users className="w-6 h-6 min-w-[1.5rem] shrink-0" />
            <span className={`transition-opacity duration-200 delay-75 ${getTextClass()}`}>Meus Clientes</span>
          </button>

          <button onClick={() => { onChangeView('service-types'); if(window.innerWidth < 768) toggle(); }} className={navItemClass('service-types')} title="Serviços">
            <Settings className="w-6 h-6 min-w-[1.5rem] shrink-0" />
            <span className={`transition-opacity duration-200 delay-75 ${getTextClass()}`}>Tipos de Serviço</span>
          </button>
          
          <button onClick={() => { onChangeView('users'); if(window.innerWidth < 768) toggle(); }} className={navItemClass('users')} title="Usuários">
            <User className="w-6 h-6 min-w-[1.5rem] shrink-0" />
            <span className={`transition-opacity duration-200 delay-75 ${getTextClass()}`}>Usuários do Sistema</span>
          </button>

          <hr className="border-gray-100 my-2" />
          
          <button onClick={() => { onChangeView('profile'); if(window.innerWidth < 768) toggle(); }} className={navItemClass('profile')} title="Minha Conta">
            <UserCog className="w-6 h-6 min-w-[1.5rem] shrink-0" />
            <span className={`transition-opacity duration-200 delay-75 ${getTextClass()}`}>Minha Conta</span>
          </button>
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium whitespace-nowrap overflow-hidden"
            title="Sair"
          >
            <LogOut className="w-6 h-6 min-w-[1.5rem] shrink-0" />
            <span className={`transition-opacity duration-200 delay-75 ${getTextClass()}`}>Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};