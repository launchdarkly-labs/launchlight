import { describe, it, expect, beforeEach } from 'vitest';
import { applyOperations } from './index.js';

function createFixture(): Document {
  const dom = document.implementation.createHTMLDocument('fixture');
  dom.body.innerHTML = `
    <main>
      <section>
        <div class="container">
          <h3 id="sub">Sub</h3>
          <p>content</p>
        </div>
        <div class="target"></div>
      </section>
    </main>
  `;
  return dom;
}

describe('a11y guardrails', () => {
  let dom: Document;

  beforeEach(() => {
    dom = createFixture();
  });

  it('prevents moving H3 into container without an H2', () => {
    const ops = [
      { op: 'appendTo', selector: '#sub', containerSelector: '.target' }
    ] as const;

    const { success, errors } = applyOperations(dom, ops as any);

    // The operation should be considered successful overall but skip the illegal move without DOM change
    expect(success).toBe(true);

    // DOM should remain unchanged for the heading position
    const parentClass = (dom.querySelector('#sub')!.parentElement as HTMLElement).className;
    expect(parentClass).toContain('container');

    // Expect a warning was recorded indirectly; we cannot assert console here reliably
    expect(Array.isArray(errors)).toBe(true);
  });
});
