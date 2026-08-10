import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

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

  useEffect(() => {
    // Load persisted wishlist on mount
    const loadWishlist = async () => {
      try {
        const stored = await SecureStore.getItemAsync('wishlist');
        if (stored) {
          setLikedEvents(new Set(JSON.parse(stored)));
        }
      } catch (error) {
        console.error('Failed to load wishlist:', error);
      }
    };
    loadWishlist();
  }, []);

  const toggleLike = async (id: string) => {
    let newSet = new Set(likedEvents);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    
    setLikedEvents(newSet);
    
    try {
      await SecureStore.setItemAsync('wishlist', JSON.stringify(Array.from(newSet)));
    } catch (error) {
      console.error('Failed to save wishlist:', error);
    }
  };

  return (
    <WishlistContext.Provider value={{ likedEvents, toggleLike }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
