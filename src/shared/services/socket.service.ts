import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../lib/jwt.js";

export class SocketService {
  private io: Server;
  private static instance: SocketService;

  private constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: [process.env.CLIENT_URL!],
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    // Authenticate socket connections using JWT
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.split(" ")[1];

        if (!token) {
          return next(new Error("Authentication required"));
        }

        const decoded = verifyAccessToken(token);

        // Attach user data to socket
        socket.data.user = decoded;
        next();
      } catch (err) {
        next(new Error("Invalid token"));
      }
    });

    this.io.on("connection", (socket: Socket) => {

      const userId = socket.data.user?.user_id;
      console.log(`Client connected: ${socket.id} (user: ${userId})`);

      // Join a conversation room
      socket.on("conversation:join", (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
        console.log(
          `Socket ${socket.id} joined conversation:${conversationId}`
        );
      });

      // Leave a conversation room
      socket.on("conversation:leave", (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        console.log(
          `Socket ${socket.id} left conversation:${conversationId}`
        );
      });

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

  /**
   * Emit an event to a specific conversation room.
   * Room name is automatically prefixed with `conversation:`.
   */
  emitToConversation(
    conversationId: string,
    event: string,
    data: unknown
  ): void {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }
}
