/**
 * 浏览器预览用的 SDK 运行时替身。
 * 只实现 UI 真正用到的两个运行时导出；类型在编译期被擦除。
 */
import React, { createContext, useContext } from "react";

export interface PreviewContext {
  settings: {
    get(key: string): unknown;
    set(key: string, value: unknown): void;
    snapshot(): Record<string, unknown>;
    useValue<T>(key: string): [T | undefined, (value: T) => void];
    useSnapshot(): Record<string, unknown>;
    subscribe(key: string, cb: (next: unknown) => void): () => void;
    cross: {
      get(uiId: string, key: string): unknown;
      set(uiId: string, key: string, value: unknown): void;
      subscribe(uiId: string, key: string, cb: (next: unknown) => void): () => void;
    };
  };
  asset: { resolve(uri: string): { url: string } };
}

const Ctx = createContext<PreviewContext | null>(null);

export function PreviewProvider(props: {
  context: PreviewContext;
  children: React.ReactNode;
}): React.ReactElement {
  return React.createElement(Ctx.Provider, { value: props.context }, props.children);
}

export function useExtensionContext(): never {
  const value = useContext(Ctx);
  if (!value) {
    throw new Error("预览环境缺少 ExtensionContext");
  }
  return value as never;
}
