// Goods available for production. Raw materials are extracted directly;
// factory goods are produced from one unit of raw material input (kept
// as a simple 1:1 mapping for this first version).

module.exports = [
  { key: 'grain', name: 'Grain', category: 'raw' },
  { key: 'iron', name: 'Iron', category: 'raw' },
  { key: 'oil', name: 'Oil', category: 'raw' },
  { key: 'timber', name: 'Timber', category: 'raw' },
  { key: 'food', name: 'Food', category: 'factory', input: 'grain' },
  { key: 'weapons', name: 'Weapons', category: 'factory', input: 'iron' },
  { key: 'fuel', name: 'Fuel', category: 'factory', input: 'oil' },
  { key: 'furniture', name: 'Furniture', category: 'factory', input: 'timber' },
];
