import { io, Socket } from "socket.io-client";

type EventCallback = (...args: any[]) => void;

class CreatorSocket {
  private socket: Socket | null = null;
  private readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Conecta manualmente al servidor de websockets
   */
  connect() {
    if (this.socket) return;
    this.socket = io(this.url, { autoConnect: false, path: "/sockete" });
    this.socket.connect();
  }

  /**
   * Desconecta del servidor
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Verifica si está conectado
   */
  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  /**
   * Registra un evento personalizado
   */
  on(event: string, callback: EventCallback) {
    this.socket?.on(event, callback);
  }

  /**
   * Emite un evento al servidor
   */
  emit(event: string, ...args: any[]) {
    this.socket?.emit(event, ...args);
  }

  /**
   * Elimina un evento registrado
   */
  off(event: string, callback?: EventCallback) {
    this.socket?.off(event, callback);
  }
}

export default CreatorSocket;
