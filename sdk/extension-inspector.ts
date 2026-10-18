/**
 * 占位文件（非 Studio 原文）。
 *
 * Studio 2.5.0 安装目录里随包发布的 SDK 副本（resources/app.asar.unpacked/dist/sdk）
 * 没有包含 extension-inspector.ts，但同目录的 index.ts 会
 * `export { ExtensionInspector } from "./extension-inspector"`。
 * 为了让本地 sdk/ 能通过 TypeScript 类型检查，这里补一个最小声明：
 * 本扩展不使用 ExtensionInspector，且 Vite 已将 @avg-studio/sdk 外置，
 * 因此它不会进入构建产物。
 *
 * 如果 Studio 重新同步了 SDK 并自带这个文件，直接删除本文件即可。
 */
import type React from "react";

export interface ExtensionInspectorProps {
  readonly id?: string;
}

export declare const ExtensionInspector: React.FC<ExtensionInspectorProps>;
