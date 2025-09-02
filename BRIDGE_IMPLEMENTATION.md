# WebExp Secure Canvas Bridge Implementation

## Overview

This document describes the implementation of the secure canvas foundation for the WebExp editor, providing element selection, drag & drop scaffolding, and live preview functionality through a secure iframe bridge.

## Architecture

### Core Components

1. **Editor Bridge Package** (`packages/editor-bridge/`)
   - UMD bundle for iframe injection
   - Secure message protocol with origin validation
   - Shadow DOM overlay for visual feedback

2. **Shared Types** (`packages/shared/src/editor/bridge.ts`)
   - Serializable message types
   - Bridge protocol definitions
   - Type guards for security validation

3. **Canvas Overlay** (`apps/editor/src/components/canvas/CanvasOverlay.tsx`)
   - React component for bridge integration
   - Cross-origin fallback handling
   - Mode switching (select, drag, preview)

4. **Preview Store** (`apps/editor/src/stores/preview-store.ts`)
   - Draft operation management
   - Live preview integration with patch-engine
   - SPA navigation persistence

## Security Features

### Message Validation
- **Origin Validation**: All messages must come from the expected iframe origin
- **Session Validation**: Each bridge instance has a unique sessionId
- **Type Validation**: Messages are validated using `isBridgeMessage` guard
- **Structured Clone**: Only serializable data crosses the postMessage boundary

### DOM Isolation
- **Shadow DOM**: All overlay UI rendered in closed shadow root
- **No Inline Scripts**: Bridge loads from external UMD file
- **CSP Compatible**: Supports nonce-based script injection

## Bridge Protocol

### Message Types

```typescript
type BridgeMessage =
  | InitPayload
  | { type: "HOVER"; sessionId: string; element: SerializedElement | null }
  | { type: "SELECT"; sessionId: string; element: SerializedElement }
  | { type: "DRAG_START"; sessionId: string; element: SerializedElement }
  | { type: "DRAG_OVER"; sessionId: string; target: DropTarget }
  | { type: "DRAG_END"; sessionId: string; operation?: unknown }
  | { type: "ERROR"; sessionId: string; code: string; detail?: string };
```

### Initialization Flow

1. **Script Injection**: Bridge script loaded into iframe
2. **INIT Message**: Parent sends initialization with sessionId and settings
3. **Bridge Setup**: Bridge creates shadow DOM overlay and event listeners
4. **Confirmation**: Bridge responds with confirmation message

### Element Selection Flow

1. **Hover Detection**: Mouse movement triggers element analysis
2. **Selector Generation**: Stable selector created using data attributes, IDs, or path
3. **Metadata Extraction**: Element properties serialized for cross-window transfer
4. **Visual Feedback**: Highlight rectangles rendered in shadow DOM

### Drag & Drop Flow

1. **Drag Start**: Mouse down on draggable element triggers DRAG_START
2. **Target Detection**: Safe container analysis for drop zones
3. **Visual Preview**: Drag ghost and drop zone highlights
4. **Operation Generation**: Final drop position generates draft operation

## Usage

### Basic Integration

```tsx
import { CanvasOverlay } from '@/components/canvas/CanvasOverlay';
import type { SerializedElement, EditorCanvasMode } from '@webexp/shared';

function MyEditor() {
  const [mode, setMode] = useState<EditorCanvasMode>('select');
  const [selectedElement, setSelectedElement] = useState<SerializedElement | null>(null);
  
  return (
    <div className="editor">
      <iframe src="/preview.html" />
      <CanvasOverlay
        iframe={iframeRef.current}
        mode={mode}
        onElementSelected={setSelectedElement}
        onElementHovered={(element) => console.log('Hover:', element)}
        onDragOperation={(op) => console.log('Drag:', op)}
      />
    </div>
  );
}
```

### Preview Store Integration

```tsx
import { usePreviewStore } from '@/stores/preview-store';

function MyInspector() {
  const { addOp, draftOps, isLiveMode } = usePreviewStore();
  
  const handleTextChange = (newText: string) => {
    addOp({
      type: 'text',
      selector: selectedElement.selector,
      value: newText
    });
  };
  
  return (
    <div>
      <p>Live Mode: {isLiveMode ? 'On' : 'Off'}</p>
      <p>Draft Operations: {draftOps.length}</p>
      {/* Inspector UI */}
    </div>
  );
}
```

## Safe Container System

### Container Marking

Elements that can be safely edited are marked with:

```html
<div data-webexp-container="true">
  <!-- Safe to edit content -->
  <p>This text can be modified</p>
  <button>This button can be moved</button>
</div>
```

### Container Features

- **Visual Feedback**: Dashed outlines show safe editing zones
- **Drop Zone Calculation**: Automatic drop target detection
- **Boundary Enforcement**: Operations only apply within safe containers
- **SPA Persistence**: Container state maintained across navigation

## Performance Optimizations

### Throttling

- **Hover Updates**: RequestAnimationFrame for smooth highlighting
- **Scroll/Resize**: 32ms throttling for layout change detection
- **Mutation Observation**: 100ms debouncing for DOM change handling

### Memory Management

- **Event Cleanup**: Proper removal of iframe event listeners
- **Shadow DOM Cleanup**: Highlight elements properly disposed
- **Bridge Destruction**: Clean shutdown on iframe unload

## Testing

### Test Page

A test page is available at `/test-bridge` that demonstrates:

- Element selection and hover
- Drag & drop operations
- Safe container visualization
- Cross-origin fallback

### Bridge Testing

```bash
# Test bridge package
cd packages/editor-bridge
pnpm test

# Test shared types
cd packages/shared
pnpm test bridge-types.test.ts

# Build and copy bridge
cd apps/editor
node scripts/copy-bridge.js
```

## Deployment

### Build Process

1. **Bridge Build**: UMD bundle created in `packages/editor-bridge/dist/`
2. **Copy Script**: Bridge copied to `apps/editor/public/overlay/`
3. **Editor Build**: Next.js build includes bridge file

### Build Commands

```bash
# Build all packages
pnpm -r build

# Build editor with bridge
cd apps/editor
pnpm build
```

## Troubleshooting

### Common Issues

1. **Bridge Not Loading**
   - Check iframe same-origin status
   - Verify bridge file exists in `/overlay/iframe-bridge.umd.js`
   - Check console for script loading errors

2. **Messages Not Received**
   - Verify origin validation
   - Check sessionId matching
   - Ensure iframe is fully loaded

3. **Visual Feedback Missing**
   - Check shadow DOM creation
   - Verify highlight manager initialization
   - Check CSS isolation

### Debug Mode

Enable debug mode by setting:

```typescript
(window as any).__WEBEXP_TEST__ = true;
```

Then access bridge instance via:

```typescript
const bridge = (window as any).__webexpBridge;
```

## Future Enhancements

### Planned Features

1. **Advanced Selectors**: CSS selector optimization and validation
2. **Operation History**: Undo/redo for preview operations
3. **Performance Metrics**: Real-time performance monitoring
4. **Extension Support**: Browser extension integration for cross-origin

### API Extensions

1. **Custom Operations**: User-defined operation types
2. **Validation Rules**: Custom validation for operations
3. **Plugin System**: Extensible bridge functionality

## Security Considerations

### Best Practices

1. **Always validate message origin and sessionId**
2. **Never trust iframe content without validation**
3. **Use structuredClone for cross-window data transfer**
4. **Implement proper cleanup on iframe unload**

### Threat Mitigation

1. **XSS Protection**: Shadow DOM isolation
2. **CSRF Protection**: Session-based message validation
3. **Data Leakage**: Structured clone validation
4. **Privilege Escalation**: Origin validation enforcement

## Conclusion

The WebExp secure canvas bridge provides a robust foundation for web experimentation with:

- **Security**: Origin validation and session management
- **Performance**: Optimized rendering and event handling
- **Usability**: Intuitive drag & drop and live preview
- **Extensibility**: Clean API for future enhancements

This implementation establishes the foundation for the P0 Lean Enterprise MVP and provides a solid base for subsequent development phases.
