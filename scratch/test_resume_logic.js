// === Mock localStorage ===
const store = {};
const mockStorage = {
  getItem: k => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};

const TOTAL_STEPS = 120;
const STEP_MS = 1000;
const ORDER_ID = 99;
const KEY = 'fe_track_start_' + ORDER_ID;

function calcStartIndex(savedStart, totalSteps) {
  if (!savedStart) return 0;
  const elapsedMs = Date.now() - parseInt(savedStart, 10);
  const elapsedSteps = Math.floor(elapsedMs / STEP_MS);
  return Math.min(elapsedSteps, totalSteps - 1);
}

let pass = 0, fail = 0;
function check(label, actual, expected, condition) {
  const ok = condition !== undefined ? condition : actual === expected;
  console.log((ok ? '✅' : '❌') + ' ' + label + ': ' + actual + (expected !== undefined ? ' (expected: ' + expected + ')' : ''));
  ok ? pass++ : fail++;
}

// TEST 1: First visit
console.log('\n--- TEST 1: Lan dau vao trang ---');
let savedStart = mockStorage.getItem(KEY);
let startIndex = savedStart ? calcStartIndex(savedStart, TOTAL_STEPS) : 0;
if (!savedStart) mockStorage.setItem(KEY, Date.now().toString());
check('startIndex lan dau', startIndex, 0);

// TEST 2: Vao lai sau 45 giay
console.log('\n--- TEST 2: Vao lai sau 45 giay ---');
mockStorage.setItem(KEY, (Date.now() - 45000).toString());
savedStart = mockStorage.getItem(KEY);
startIndex = calcStartIndex(savedStart, TOTAL_STEPS);
check('startIndex sau 45s', startIndex, '~45', startIndex >= 44 && startIndex <= 46);

// TEST 3: Vao lai sau 200 giay (qua thoi gian giao)
console.log('\n--- TEST 3: Vao lai sau 200 giay (qua thoi gian) ---');
mockStorage.setItem(KEY, (Date.now() - 200000).toString());
savedStart = mockStorage.getItem(KEY);
startIndex = calcStartIndex(savedStart, TOTAL_STEPS);
check('startIndex clamped', startIndex, TOTAL_STEPS - 1);

// TEST 4: Xoa key khi xong
console.log('\n--- TEST 4: Xoa localStorage khi giao hang xong ---');
mockStorage.removeItem(KEY);
check('key sau removeItem', mockStorage.getItem(KEY), null);

// TEST 5: Khong co savedStart -> startIndex = 0
console.log('\n--- TEST 5: Khong co savedStart ---');
check('startIndex khi chua co key', calcStartIndex(null, TOTAL_STEPS), 0);

console.log('\n==============================');
console.log('PASS: ' + pass + ' / FAIL: ' + fail);
console.log(fail === 0 ? '🎉 TAT CA TESTS PASSED!' : '❌ CO LOI, KIEM TRA LAI!');
