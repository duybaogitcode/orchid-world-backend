import { Logger, OnModuleInit } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit
{
  @WebSocketServer()
  server: Server;
  private logger: Logger = new Logger('MessageGateway');
  private socketMap = new Map<string, Socket>();

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  emitTo(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

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

  @SubscribeMessage('joinRoom')
  public joinRoom(client: Socket, room: string): void {
    console.log('🚀 ~ joinRoom ~ room:', room);
    client.join(room);
    client.emit('joinedRoom', room);
  }

  @SubscribeMessage('leaveRoom')
  public leaveRoom(client: Socket, room: string): void {
    client.leave(room);
    client.emit('leftRoom', room);
  }

  public afterInit(server: Server): void {
    return this.logger.log('Init');
  }

  public handleDisconnect(client: Socket): void {
    return this.logger.log(`Client disconnected: ${client.id}`);
  }

  public handleConnection(client: Socket): void {
    return this.logger.log(`Client connected: ${client.id}`);
  }
}
