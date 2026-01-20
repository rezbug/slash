import { createState } from './src/state';

// Simular SSR
globalThis.__SLASH_SSR__ = true;
globalThis.__SLASH_TRACK_ACCESS__ = (state, prop, value) => {
  console.log('TRACK_ACCESS called:', prop, value);
};

const sig1 = createState({ value: "stream1" });
const obj = sig1.get();
console.log('obj:', obj);
console.log('obj.value:', obj.value);
