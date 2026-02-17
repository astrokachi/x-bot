import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

export class SocketService {
  private io: Server;
  private static instance: SocketService;

  private constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: [process.env.CLIENT_URL!],
        credentials: true,
      },
    });

    this.io.on("connection", (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on("disconnect", (reason: string) => {
        console.log(`Client disconnected: ${socket.id} — ${reason}`);
      });
    });
  }

  static init(server: HttpServer): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService(server);
    }
    return SocketService.instance;
  }

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      throw new Error(
        "SocketService not initialized. Call SocketService.init(server) first."
      );
    }
    return SocketService.instance;
  }

  getIO(): Server {
    return this.io;
  }

  emitToAll(event: string, data: unknown): void {
    this.io.emit(event, data);
  }

  emitToRoom(room: string, event: string, data: unknown): void {
    this.io.to(room).emit(event, data);
  }

  emitToSocket(socketId: string, event: string, data: unknown): void {
    this.io.to(socketId).emit(event, data);
  }
}
