import { createState } from './src/state';
import { renderToString, htmlString } from './src/server-render';

console.log('=== Before renderToString ===');
const sig1 = createState({ value: "stream1" });

const Component = () => {
  console.log('Component executing');
  console.log('__SLASH_SSR__:', globalThis.__SLASH_SSR__);
  console.log('__SLASH_TRACK_ACCESS__:', typeof globalThis.__SLASH_TRACK_ACCESS__);
  
  const obj = sig1.get();
  console.log('After get(), obj:', obj);
  console.log('obj is Proxy?:', typeof obj === 'object');
  
  const { value } = obj;
  console.log('After destructuring, value:', value);
  
  return htmlString`<div>${value}</div>`;
};

console.log('\n=== Calling renderToString ===');
const { html, state } = renderToString(Component);
console.log('\n=== Results ===');
console.log('HTML:', html);
console.log('State:', state);
