import { htmlString } from './src/server-render';
import { createState } from './src/state';

const accessedValues = new Map();

globalThis.__SLASH_SSR__ = true;
globalThis.__SLASH_TRACK_STATE__ = () => {};
globalThis.__SLASH_TRACK_ACCESS__ = (state, prop, value) => {
  console.log('*** TRACK_ACCESS:', prop, '=', value);
  accessedValues.set(value, { state, prop });
};

const sig1 = createState({ value: "stream1" });
const obj = sig1.get();
const { value } = obj;

console.log('\nvalue before htmlString:', value);
console.log('accessedValues.has(value):', accessedValues.has(value));

const result = htmlString`<div>${value}</div>`;
console.log('\nresult:', result);
