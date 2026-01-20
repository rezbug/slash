const map = new Map();
const num = 30;
map.set(num, 'found');

console.log('30 === 30:', 30 === 30);
console.log('num === 30:', num === 30);
console.log('map.has(30):', map.has(30));
console.log('map.has(num):', map.has(num));

const other = 30;
console.log('map.has(other):', map.has(other));
