import { useEffect } from 'react';
import { socketService } from '@/lib/socket';

export const useSocket = (event: string, callback: (data: any) => void) => {
  useEffect(() => {
    const socket = socketService.connect();
    
    socket.on(event, callback);
    
    return () => {
      socket.off(event, callback);
    };
  }, [event, callback]);
};

export const useSocketEmitter = () => {
  const socket = socketService.connect();
  
  const emit = (event: string, data: unknown) => {
    socket.emit(event, data);
  };
  
  return { emit };
};
