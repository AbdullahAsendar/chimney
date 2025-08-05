import { Outlet } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';

export function ClassicLayout() {
  return (
    <>

      <div className="flex flex-col items-center justify-center grow bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating geometric shapes */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200/50 dark:bg-blue-900/50 rounded-lg animate-spin" style={{ animationDuration: '8s' }}></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-indigo-200/60 dark:bg-indigo-900/60 rotate-45 animate-pulse"></div>
          <div className="absolute top-1/2 left-3/4 w-20 h-20 bg-slate-200/50 dark:bg-slate-700/50 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
          
          {/* Morphing gradient orbs */}
          <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-gradient-to-r from-blue-300/40 to-indigo-300/40 dark:from-blue-800/40 dark:to-indigo-800/40 rounded-full animate-pulse" style={{ animationDuration: '3s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-gradient-to-r from-indigo-300/40 to-purple-300/40 dark:from-indigo-800/40 dark:to-purple-800/40 rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
          
          {/* Floating diamonds */}
          <div className="absolute top-1/6 right-1/6 w-16 h-16 bg-purple-200/60 dark:bg-purple-900/60 rotate-45 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}></div>
          <div className="absolute top-2/3 left-1/6 w-12 h-12 bg-cyan-200/70 dark:bg-cyan-900/70 rotate-45 animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Animated waves */}
          <div className="absolute bottom-1/3 right-1/3 w-36 h-36 border-2 border-blue-300/50 dark:border-blue-700/50 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
          <div className="absolute top-1/3 left-1/3 w-28 h-28 border-2 border-indigo-300/50 dark:border-indigo-700/50 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
          
          {/* Floating particles with different shapes */}
          <div className="absolute top-1/2 right-1/2 w-3 h-3 bg-blue-400/80 dark:bg-blue-500/80 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/4 right-1/2 w-2 h-2 bg-indigo-400/90 dark:bg-indigo-500/90 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute bottom-1/4 left-1/2 w-2.5 h-2.5 bg-slate-400/70 dark:bg-slate-500/70 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }}></div>
        </div>
        <Outlet />
      </div>
    </>
  );
}
