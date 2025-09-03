import { describe, it, expect, beforeEach } from 'vitest';
import { applyOperations } from './index.js';
import { sanitizeHTML } from './sanitizer.js';

function createFixture(): Document {
  const dom = document.implementation.createHTMLDocument('fixture');
  dom.body.innerHTML = `
    <main>
      <section>
        <h2 id="heading">Title</h2>
        <p class="lead">Welcome</p>
        <img id="hero" src="/hero-a.jpg" alt="Hero" />
        <div class="list" data-webexp-container="true">
          <span class="item" data-id="a">A</span>
          <span class="item" data-id="b">B</span>
          <span class="item" data-id="c">C</span>
        </div>
      </section>
    </main>
  `;
  return dom;
}

describe('patch-engine idempotence & sanitizer', () => {
  let dom: Document;

  beforeEach(() => {
    dom = createFixture();
  });

  it('applies operations idempotently', () => {
    const ops = [
      { op: 'textReplace', selector: 'h2#heading', value: 'New Title' },
      { op: 'classAdd', selector: '.lead', value: 'highlight' },
      { op: 'styleSet', selector: '.lead', name: 'color', value: 'red' },
      { op: 'imgSwap', selector: '#hero', src: 'https://example.com/hero-b.jpg', alt: 'New Hero' },
      { op: 'attrSet', selector: '.lead', name: 'data-test', value: 'ok' },
      { op: 'moveAfter', selector: '.item[data-id="a"]', targetSelector: '.item[data-id="b"]' },
      { op: 'appendTo', selector: '.item[data-id="c"]', containerSelector: '.list' },
      { op: 'duplicate', selector: '.item[data-id="b"]', mode: 'shallow' },
      { op: 'insertHTML', selector: '.lead', html: '<strong>Welcome</strong>' }
    ] as const;

    const first = applyOperations(dom, ops as any);

    const countAfterFirst = dom.querySelectorAll('.item[data-id="b"][data-webexp-duplicate="true"]').length;

    const second = applyOperations(dom, ops as any);

    const countAfterSecond = dom.querySelectorAll('.item[data-id="b"][data-webexp-duplicate="true"]').length;

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(countAfterSecond).toBe(countAfterFirst);
  });

  it('sanitizes inserted HTML', () => {
    const dirty = `<img src="x" onerror=alert(1) /><script>alert(2)</script><div>ok</div>`;
    const clean = sanitizeHTML(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('onerror');
    expect(clean).toContain('<div>ok</div>');
  });
});
