import { createState } from './src/state';

const accessedValues = new Map();

globalThis.__SLASH_SSR__ = true;
globalThis.__SLASH_TRACK_ACCESS__ = (state, prop, value) => {
  console.log('*** TRACK_ACCESS called:', prop, value);
  accessedValues.set(value, { state, prop });
  console.log('*** accessedValues size:', accessedValues.size);
  console.log('*** accessedValues.has(value):', accessedValues.has(value));
};

const sig1 = createState({ value: "stream1" });
const obj = sig1.get();
const { value } = obj;

console.log('\nAfter destructuring:');
console.log('value:', value);
console.log('accessedValues.has(value):', accessedValues.has(value));
console.log('accessedValues.has("stream1"):', accessedValues.has("stream1"));
console.log('accessedValues:', accessedValues);
