import type { Bounds, SerializedElement, ElementMetadata } from "@webexp/shared";

export type InternalElementRef = {
  el: Element;
  selector: string;
  bounds: Bounds;
  meta: ElementMetadata;
  containerSafe: boolean;
  selectorUnique: boolean;
  canDrag: boolean;
  nearestContainerSelector?: string;
};
