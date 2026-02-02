
import React from 'react';
import { LogOut, FileText, User, Settings, PieChart, Home, X, Pin, PinOff, Users, Landmark, NotebookPen } from 'lucide-react';

export type ViewType = 'home' | 'contracts' | 'notes' | 'clients' | 'users' | 'service-types' | 'revenue' | 'profile';

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
  
  const getTextClass = () => {
    if (isOpen) return 'opacity-100 translate-x-0';
    return isPinned ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0';
  };

  const navItemClass = (view: ViewType) => `
    w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 font-black uppercase tracking-widest text-[10px] whitespace-nowrap relative
    ${activeView === view 
      ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/30' 
      : 'text-gray-400 hover:bg-primary-50 hover:text-primary-600'
    }
  `;

  const containerClasses = `
    fixed top-0 left-0 h-screen bg-white border-r border-gray-100 flex flex-col z-40 transition-all duration-300 ease-in-out
    ${isOpen ? 'translate-x-0 shadow-2xl w-64' : '-translate-x-full md:translate-x-0 md:shadow-none'}
    ${isPinned ? 'md:w-64' : 'md:w-20 md:hover:w-64 group'}
  `;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden" onClick={toggle}></div>}

      <div className={containerClasses}>
        <div className="p-5 pb-6 flex flex-col items-center md:items-start">
          <div className="flex items-center gap-4 w-full">
             <div className="h-12 w-12 min-w-[3rem] bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-600/30 shrink-0">
                 <Landmark className="text-white w-6 h-6" />
             </div>
             <div className={`transition-all duration-500 whitespace-nowrap ${getTextClass()}`}>
                <h1 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">WES</h1>
                <p className="text-[9px] text-primary-600 font-black uppercase tracking-[0.2em] mt-1">Financeiro</p>
             </div>
             
             {isOpen && (
               <button onClick={toggle} className="md:hidden text-gray-400 ml-auto p-2">
                 <X className="w-6 h-6" />
               </button>
             )}

             <button 
                onClick={onTogglePin} 
                className={`hidden md:block ml-auto text-gray-300 hover:text-primary-500 transition-colors p-1 ${isPinned || 'opacity-0 group-hover:opacity-100'}`}
             >
                {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
             </button>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
          <button onClick={() => { onChangeView('home'); if(window.innerWidth < 768) toggle(); }} className={navItemClass('home')}>
            <Home className="w-6 h-6 min-w-[1.5rem] shrink-0" />
            <span className={`transition-all duration-300 ${getTextClass()}`}>Dashboard</span>
          </button>
          
          <button onClick={() => { onChangeView('contracts'); if(window.innerWidth < 768) toggle(); }} className={navItemClass('contracts')}>
            <FileText className="w-6 h-6 min-w-[1.5rem] shrink-0" />
            <span className={`transition-all duration-300 ${getTextClass()}`}>Transações</span>
          </button>

          <button onClick={() => { onChangeView('notes'); if(window.innerWidth < 768) toggle(); }} className={navItemClass('notes')}>
            <NotebookPen className="w-6 h-6 min-w-[1.5rem] shrink-0" />
            <span className={`transition-all duration-300 ${getTextClass()}`}>Anotações</span>
          </button>

          <button onClick={() => { onChangeView('revenue'); if(window.innerWidth < 768) toggle(); }} className={navItemClass('revenue')}>
            <PieChart className="w-6 h-6 min-w-[1.5rem] shrink-0" />
            <span className={`transition-all duration-300 ${getTextClass()}`}>Relatório Geral</span>
          </button>

          <button onClick={() => { onChangeView('clients'); if(window.innerWidth < 768) toggle(); }} className={navItemClass('clients')}>
            <Users className="w-6 h-6 min-w-[1.5rem] shrink-0" />
            <span className={`transition-all duration-300 ${getTextClass()}`}>Clientes/Fornec</span>
          </button>

          <button onClick={() => { onChangeView('service-types'); if(window.innerWidth < 768) toggle(); }} className={navItemClass('service-types')}>
            <Settings className="w-6 h-6 min-w-[1.5rem] shrink-0" />
            <span className={`transition-all duration-300 ${getTextClass()}`}>Configurações</span>
          </button>
          
          <button onClick={() => { onChangeView('users'); if(window.innerWidth < 768) toggle(); }} className={navItemClass('users')}>
            <User className="w-6 h-6 min-w-[1.5rem] shrink-0" />
            <span className={`transition-all duration-300 ${getTextClass()}`}>Equipe</span>
          </button>
        </nav>

        <div className="p-3 border-t border-gray-50 mt-auto">
          <button onLogout={onLogout} className="w-full flex items-center gap-4 px-4 py-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-black uppercase text-[10px]">
            <LogOut className="w-6 h-6 min-w-[1.5rem] shrink-0" />
            <span className={`transition-all duration-300 ${getTextClass()}`}>Encerrar</span>
          </button>
        </div>
      </div>
    </>
  );
};
