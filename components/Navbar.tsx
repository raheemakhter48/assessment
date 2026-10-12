'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/UserContext';
import { ChevronDown, Check, Terminal, Cpu, Shield, Activity } from 'lucide-react';

export default function Navbar() {
  const { currentUser, allUsers, switchUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1f212c] bg-[#090a0f]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Industrial Monolith */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-3 group transition-transform active:scale-95"
            id="nav-brand-logo"
          >
            <div className="w-9 h-9 rounded-lg bg-[#141620] border border-[#2b2e3e] flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.15)] group-hover:border-sky-500/50 group-hover:shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-tech font-bold text-sm tracking-wider uppercase text-zinc-100">
                  AJAIA<span className="text-sky-400">::</span>DOCS
                </span>
                <span className="text-[10px] font-mono-tech font-bold px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/60 uppercase tracking-widest">
                  SYS_v1.0
                </span>
              </div>
              <p className="text-[11px] font-mono-tech text-zinc-500 uppercase tracking-tight">
                Engineered Workspace
              </p>
            </div>
          </Link>

          {/* Industrial Status Readout (Desktop) */}
          <div className="hidden lg:flex items-center gap-4 pl-4 border-l border-[#1f212c] text-[11px] font-mono-tech text-zinc-500">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
              <span className="text-zinc-400">CLUSTER: READY</span>
            </div>
            <div className="text-zinc-600">/</div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-zinc-500" />
              <span>SYNC_LATENCY: 12ms</span>
            </div>
          </div>
        </div>

        {/* User Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] font-mono-tech text-zinc-500 uppercase tracking-wider">
              OPERATOR:
            </span>
            <button
              id="user-switcher-button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-[#272a38] bg-[#12131b] hover:border-[#383c4e] hover:bg-[#181924] shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-sky-500/50"
              aria-label="Switch Operator"
            >
              <div className="w-6 h-6 rounded bg-[#1c1d28] border border-[#2b2e40] flex items-center justify-center text-xs">
                {currentUser.avatar}
              </div>
              <div className="text-left hidden xs:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono-tech font-semibold text-zinc-200">
                    {currentUser.name.toUpperCase()}
                  </span>
                  <span className="text-[9px] font-mono-tech px-1.5 py-0.2 rounded bg-[#1e202d] text-zinc-400 border border-[#2a2d3e]">
                    {currentUser.title.split(' ')[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] font-mono-tech text-zinc-500 block truncate max-w-[130px]">
                  {currentUser.email}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180 text-sky-400' : ''
                }`}
              />
            </button>
          </div>

          {/* Switcher Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#111218] border border-[#262837] shadow-2xl shadow-black/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-2 border-b border-[#1d1f2b]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono-tech font-bold text-zinc-400 uppercase tracking-widest">
                    SESSION_AUTHENTICATION
                  </p>
                  <Cpu className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <p className="text-[11px] font-mono-tech text-zinc-500 mt-0.5">
                  Simulate authorization state
                </p>
              </div>

              <div className="p-1 space-y-1">
                {allUsers.map((user) => {
                  const isActive = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      id={`switch-user-${user.name.toLowerCase()}`}
                      onClick={() => {
                        switchUser(user);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all ${
                        isActive
                          ? 'bg-[#181a24] text-zinc-100 border border-sky-500/40 shadow-[0_0_10px_rgba(14,165,233,0.1)]'
                          : 'hover:bg-[#151620] text-zinc-400 hover:text-zinc-200 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-[#1c1e2a] border border-[#2b2e40] flex items-center justify-center text-sm">
                          {user.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono-tech font-bold text-zinc-200">
                              {user.name.toUpperCase()}
                            </span>
                            <span className="text-[9px] font-mono-tech px-1.5 py-0.5 rounded bg-[#1e202d] text-zinc-400 border border-[#2b2d3d]">
                              {user.title}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono-tech text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-sky-400 ml-2 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="px-3 py-2 mt-1 border-t border-[#1d1f2b] bg-[#0c0d12] rounded-b-lg">
                <div className="flex items-center gap-1.5 text-[10px] font-mono-tech text-zinc-500">
                  <Shield className="w-3 h-3 text-sky-500" />
                  <span>RBAC_ACTIVE: INSTANT PRIVILEGE EVAL</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
