'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SEEDED_USERS } from '@/lib/types';

interface UserContextType {
  currentUser: User;
  allUsers: User[];
  switchUser: (user: User) => void;
  authHeaders: { 'x-user-id': string; 'Content-Type': string };
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(SEEDED_USERS[0]);

  useEffect(() => {
    const savedUserId = localStorage.getItem('ajaia_active_user_id');
    if (savedUserId) {
      const found = SEEDED_USERS.find((u) => u.id === savedUserId);
      if (found) setCurrentUser(found);
    }
  }, []);

  const switchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('ajaia_active_user_id', user.id);
  };

  const authHeaders = {
    'x-user-id': currentUser.id,
    'Content-Type': 'application/json',
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        allUsers: SEEDED_USERS,
        switchUser,
        authHeaders,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useAuth(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useAuth must be used within a UserProvider');
  }
  return context;
}
