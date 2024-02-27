import { OnModuleInit } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class EventGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  private socketMap = new Map<string, Socket>();

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log('socket', socket.id);
      console.log('Connected');
      this.socketMap.set(socket.id, socket);

      socket.emit('onMessage', {
        msg: 'Welcome to the server!',
      });

      socket.on('disconnect', () => {
        this.socketMap.delete(socket.id);
      });
    });
  }

  @SubscribeMessage('newMessage')
  onNewMessage(@MessageBody() body: any) {
    console.log('data', body);
    // Emit to a specific socket
    const socket = this.socketMap.get(body.socketId);
    if (socket) {
      socket.emit('onMessage', {
        msg: 'Hello from server',
        content: body,
      });
      socket.emit('notification', {
        msg: 'This is a notification from the server',
      });
    }
  }
}
