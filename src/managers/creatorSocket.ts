import { io, Socket } from "socket.io-client";

type EventCallback = (...args: any[]) => void;

class CreatorSocket {
  private socket: Socket | null = null;
  private subscriptions = 0;
  private readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Escucha una notificación, conectando con el primer suscriptor.
   *
   * Para listeners que comparten la conexión entre varias instancias: a diferencia
   * de `disconnect()`, que la cierra para todos, solo libera la propia suscripción
   * y cierra el socket cuando se va la última.
   * @returns Función que libera esta suscripción.
   */
  subscribe(notificationId: string, callback: EventCallback): () => void {
    if (!notificationId) {
      return () => {};
    }

    this.connect();

    // Capturado para que una liberación tardía no actúe sobre un socket que ya
    // fue reemplazado por una conexión más nueva.
    const socket = this.socket!;

    socket.on(notificationId, callback);
    socket.emit("registerNotification", { notificationId });
    this.subscriptions += 1;

    let released = false;

    return () => {
      if (released) return;
      released = true;

      socket.off(notificationId, callback);
      this.subscriptions -= 1;

      if (this.subscriptions === 0 && this.socket === socket) {
        this.disconnect();
      }
    };
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
