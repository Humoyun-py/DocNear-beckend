import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BoldText } from '../src/components/common/BoldText';

test('AI content renders HTML payloads as text, including bold segments', () => {
  const html = renderToStaticMarkup(createElement(BoldText, { text: '<img src=x onerror=alert(1)> **<script>alert(1)</script>**' }));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('<script'));
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('<strong'));
});
