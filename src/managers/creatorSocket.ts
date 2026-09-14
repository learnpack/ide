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
   * Listens for one notification, connecting on the first subscriber.
   *
   * For listeners that share the connection across several instances: unlike
   * `disconnect()`, which closes it for everyone, it only releases its own
   * subscription and closes the socket when the last one goes.
   * @returns Function that releases this subscription.
   */
  subscribe(notificationId: string, callback: EventCallback): () => void {
    if (!notificationId) {
      return () => {};
    }

    this.connect();

    // Captured so a late release cannot act on a socket that has since been
    // replaced by a newer connection.
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
   * Manually connects to the websocket server
   */
  connect() {
    if (this.socket) return;
    this.socket = io(this.url, { autoConnect: false, path: "/sockete" });
    this.socket.connect();
  }

  /**
   * Disconnects from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Checks whether it is connected
   */
  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  /**
   * Registers a custom event
   */
  on(event: string, callback: EventCallback) {
    this.socket?.on(event, callback);
  }

  /**
   * Emits an event to the server
   */
  emit(event: string, ...args: any[]) {
    this.socket?.emit(event, ...args);
  }

  /**
   * Removes a registered event
   */
  off(event: string, callback?: EventCallback) {
    this.socket?.off(event, callback);
  }
}

export default CreatorSocket;
