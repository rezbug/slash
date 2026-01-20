import { createState } from './src/state';

globalThis.__SLASH_SSR__ = true;
globalThis.__SLASH_TRACK_ACCESS__ = (state, prop, value) => {
  console.log('*** TRACK_ACCESS called:', prop, value);
};

const sig1 = createState({ value: "stream1" });
console.log('Getting state...');
const obj = sig1.get();
console.log('Destructuring...');
const { value } = obj;
console.log('value:', value);
