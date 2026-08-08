import React, { createContext, useContext, useState } from 'react';

type WishlistContextType = {
  likedEvents: Set<string>;
  toggleLike: (id: string) => void;
};

const WishlistContext = createContext<WishlistContextType>({
  likedEvents: new Set(),
  toggleLike: () => {},
});

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const [likedEvents, setLikedEvents] = useState<Set<string>>(new Set());

  const toggleLike = (id: string) => {
    setLikedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  return (
    <WishlistContext.Provider value={{ likedEvents, toggleLike }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
