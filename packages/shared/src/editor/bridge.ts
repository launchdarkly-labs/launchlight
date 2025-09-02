import { z } from "zod";

export type EditorCanvasMode = "select" | "drag" | "preview" | "edit";

export type Bounds = {
  x: number; y: number; w: number; h: number;
  scrollX: number; scrollY: number; dpr: number;
};

export type ElementMetadata = {
  tagName: string;
  id?: string;
  classes: string[];
  attributes: Record<string,string>;
  textContent?: string;
  role?: string;
};

export type SerializedElement = {
  selector: string;             // stable selector (string)
  xpath?: string;               // optional fallback
  bounds: Bounds;               // plain object, not DOMRect
  metadata: ElementMetadata;
  containerSafe: boolean;
  selectorUnique: boolean;
  canDrag: boolean;
  nearestContainerSelector?: string;
};

export type DropTarget = {
  selector: string;             // container selector
  position: "before" | "after" | "append";
  bounds: Bounds;
};

export type BridgeSettings = {
  highlightColor: string;
  containerColor: string;
  selectionColor: string;
  enableSafeContainers: boolean;
  nonce?: string;               // optional CSP nonce
};

export type InitPayload = {
  type: "INIT";
  sessionId: string;
  parentOrigin: string;
  mode: EditorCanvasMode;
  settings: BridgeSettings;
};

export type BridgeMessage =
  | InitPayload
  | { type: "HOVER"; sessionId: string; element: SerializedElement | null }
  | { type: "SELECT"; sessionId: string; element: SerializedElement }
  | { type: "DRAG_START"; sessionId: string; element: SerializedElement }
  | { type: "DRAG_OVER"; sessionId: string; target: DropTarget }
  | { type: "DRAG_END"; sessionId: string; operation?: unknown } // WebExpOp draft (opaque here)
  | { type: "ERROR"; sessionId: string; code: string; detail?: string };

export function isBridgeMessage(value: unknown): value is BridgeMessage {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as any;
  if (typeof obj.type !== 'string' || typeof obj.sessionId !== 'string') return false;
  
  // Additional validation based on message type
  switch (obj.type) {
    case 'INIT':
      return typeof obj.parentOrigin === 'string' && 
             typeof obj.mode === 'string' && 
             obj.settings && typeof obj.settings === 'object';
    case 'HOVER':
      return obj.element === null || (obj.element && typeof obj.element === 'object');
    case 'SELECT':
    case 'DRAG_START':
      return obj.element && typeof obj.element === 'object';
    case 'DRAG_OVER':
      return obj.target && typeof obj.target === 'object';
    case 'DRAG_END':
      return true; // operation is optional
    case 'ERROR':
      return typeof obj.code === 'string';
    default:
      return false;
  }
}
