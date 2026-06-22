import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../services/api';
import { Message } from '../types/message';

export function useSocket(communityId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const { token } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('new-message', (message: Message) => {
      queryClient.invalidateQueries({ queryKey: ['messages', message.communityId] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, queryClient]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !communityId) return;

    const room = `community:${communityId}`;
    socket.emit('join', room);

    return () => {
      socket.emit('leave', room);
    };
  }, [communityId]);

  return socketRef.current;
}
