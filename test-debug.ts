import { createState } from './src/state';
import { renderToString, htmlString } from './src/server-render';

const sig1 = createState({ value: "stream1" });
const Component = () => {
  const { value } = sig1.get();
  console.log('value:', value, 'type:', typeof value);
  return htmlString`<div>${value}</div>`;
};

const { html, state } = renderToString(Component);
console.log('HTML:', html);
console.log('State:', state);
