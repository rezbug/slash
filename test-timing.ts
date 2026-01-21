import { createState } from './src/state';

const accessedValues = new Map();

globalThis.__SLASH_SSR__ = true;
globalThis.__SLASH_TRACK_ACCESS__ = (state, prop, value) => {
  console.log('1. TRACK_ACCESS called with:', value);
  accessedValues.set(value, { state, prop });
};

const sig1 = createState({ value: "stream1" });

console.log('Step 1: Calling get()');
const obj = sig1.get();

console.log('\nStep 2: Destructuring');
const { value } = obj;

console.log('\nStep 3: Checking Map');
console.log('accessedValues.size:', accessedValues.size);
console.log('value:', value);
console.log('value === "stream1":', value === "stream1");
console.log('accessedValues.has(value):', accessedValues.has(value));
console.log('accessedValues.has("stream1"):', accessedValues.has("stream1"));

// Simular o que acontece depois
console.log('\nStep 4: Tentando recuperar');
const recovered = accessedValues.get(value);
console.log('recovered:', recovered);
