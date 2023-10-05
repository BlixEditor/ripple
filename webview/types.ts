export type WindowWithApis = Window & typeof globalThis & {
  api: {
    send: (channel: string, data: any) => {};
    on: (channel: string, func: (..._: any) => any) => {};
  };

  cache: {
    write: (content: Blob, metadata?: any) => Promise<string | null>;
    get: (id: string) => Promise<any | null>;
    delete: (id: string) => Promise<boolean>;
  };
};