import { useState, useEffect, useCallback } from 'react';

export const useWindowActivity = () => {
  const [isWindowActive, setIsWindowActive] = useState(true);
  const [inactiveTime, setInactiveTime] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const handleActivity = useCallback(() => {
    setIsWindowActive(true);
    setLastActivity(Date.now());
    setInactiveTime(0);
  }, []);

  useEffect(() => {
    const events = [
      'mousedown', 'mousemove', 'keydown', 'scroll', 
      'touchstart', 'click', 'input'
    ];

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowActive(false);
      } else {
        handleActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      if (isWindowActive) {
        const currentTime = Date.now();
        const diff = Math.floor((currentTime - lastActivity) / 1000);
        
        if (diff > 5) {
          setIsWindowActive(false);
        }
        setInactiveTime(diff);
      }
    }, 1000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [handleActivity, isWindowActive, lastActivity]);

  return { isWindowActive, inactiveTime };
};