export interface Global {
  ServerIO: any;
  ClientIO: any;
}

export enum EventName {
  connect = 'connect',
  connection = 'connection',
  disconnecting = 'disconnecting',
  disconnect = 'disconnect',
  klines = 'klines',
}

export enum Method {
  subscribe = 'subscribe',
  unsubscribe = 'unsubscribe',
}

export interface ClientWsMsg {
  op: Method;
  args: string[];
}
