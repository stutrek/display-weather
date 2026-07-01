#!/usr/bin/env node
// Evaluates inferCloudType against meteorologically-grounded ground truth.
// Run: node scripts/evaluate-cloud-inference.js

// ── Inline inferCloudType (copied from src so no transpile needed) ────────────

function inferCloudType(f, isNight = false) {
  if (isNight) return 'none';
  const condition = f.condition ?? '';
  const coverage = (f.cloud_coverage ?? 50) / 100;
  const humidity = f.humidity ?? 60;
  const precip = f.precipitation ?? 0;
  const uv = f.uv_index ?? 4;

  if (coverage < 0.01) return 'none';
  if (condition === 'sunny' || condition === 'clear-night' || condition === 'clear') {
    if (coverage < 0.15) return 'none';
  }

  if (condition === 'fog' || condition === 'hazy' || condition === 'foggy') return 'stratus';

  if (['lightning-rainy','exceptional'].includes(condition)) return 'cumulonimbus';
  if (['rainy','pouring','snowy','snowy-rainy','hail'].includes(condition)) return 'stratus';

  let cumulus = 0, stratocumulus = 0, stratus = 0, cirrus = 0;

  if (coverage >= 0.08 && coverage < 0.65)      cumulus += 2;
  if (coverage >= 0.30 && coverage < 0.88)      stratocumulus += 2;
  if (coverage >= 0.75)                         stratus += 2;
  if (coverage >= 0.92 && (condition === 'cloudy' || condition === 'partlycloudy' || condition === 'overcast'))
    stratus += 2;

  if (humidity < 45)       { cumulus += 0.5; cirrus += 1; }
  else if (humidity < 65)  cumulus += 1.5;
  else if (humidity < 82)  stratocumulus += 1.5;
  else                     stratus += 2;

  if (precip === 0)        cumulus += 0.5;
  else if (precip < 0.3)   stratocumulus += 1;
  else                     stratus += 2;

  if (uv > 7 && humidity < 45)       cirrus += 3;
  else if (uv > 6 && humidity < 55)  cirrus += 1;
  else if (uv > 3)                   cumulus += 0.5;
  else if (uv <= 1)                  stratus += 0.5;

  if (condition === 'partlycloudy')              { cumulus += 1; stratocumulus += 0.5; }
  else if (condition === 'cloudy')               { stratocumulus += 2; stratus += 0.5; }
  else if (condition === 'overcast')             stratus += 2;
  else if (condition === 'sunny' || condition === 'clear-night') cumulus += 1.5;

  const scores = { cumulus, stratocumulus, stratus, cirrus, none: 0 };
  return Object.entries(scores).sort(([,a],[,b]) => b - a)[0][0];
}

// ── Ground truth ──────────────────────────────────────────────────────────────
// Based on:
//   - HA condition string (hard rules for precipitation/fog/thunder)
//   - Cloud base height from dew point spread: base_ft = (T - Td) / 4.4 * 1000
//     Approximation from RH: Td_depression_F ≈ (100 - RH) * 0.99
//   - Coverage thresholds from NWS cloud level definitions

function groundTruth(f) {
  const condition = f.condition ?? '';
  const coverage  = (f.cloud_coverage ?? 50) / 100;
  const humidity  = f.humidity ?? 60;
  const precip    = f.precipitation ?? 0;
  const temp      = f.temperature ?? 70; // °F
  const uv        = f.uv_index ?? 4;

  if (coverage < 0.08) return 'none';
  if ((condition === 'sunny' || condition === 'clear') && coverage < 0.15) return 'none';

  // Fog → stratus always
  if (['fog','foggy','hazy'].includes(condition)) return 'stratus';

  // Cumulonimbus conditions — we don't render this yet but it's the right answer
  if (['lightning-rainy','exceptional'].includes(condition)) return 'cumulonimbus';

  // Nimbostratus / heavy precip → stratus family
  if (['rainy','pouring','snowy','snowy-rainy','hail'].includes(condition) || precip > 0.3)
    return 'stratus';

  // Estimate cloud base height (feet) from dewpoint spread
  const dewpointDepression_F = (100 - humidity) * 0.99;
  const baseHeight_ft = (dewpointDepression_F / 4.4) * 1000;

  // High clouds (>16,500 ft) — cirrus family
  if (baseHeight_ft > 16500) {
    if (coverage < 0.45) return 'cirrus';
    return 'cirrus'; // cirrostratus — render same
  }

  // Mid-level (6,500–16,500 ft) — altocumulus / altostratus
  if (baseHeight_ft > 6500) {
    if (coverage > 0.70) return 'stratus';      // altostratus → closest render
    return 'stratocumulus';                      // altocumulus → closest render
  }

  // Low clouds (<6,500 ft)
  if (coverage >= 0.80) return 'stratus';
  if (coverage >= 0.40) return 'stratocumulus';
  return 'cumulus';
}

// ── Test matrix ───────────────────────────────────────────────────────────────

const CONDITIONS = [
  'sunny', 'clear', 'partlycloudy', 'cloudy', 'overcast',
  'fog', 'hazy',
  'rainy', 'pouring', 'snowy', 'snowy-rainy', 'hail',
  'lightning-rainy', 'exceptional',
  'windy',
];

const COVERAGES  = [0, 10, 20, 35, 50, 65, 80, 95];
const HUMIDITIES = [30, 55, 75, 90];

const rows = [];
let correct = 0, wrong = 0;

for (const condition of CONDITIONS) {
  for (const cloud_coverage of COVERAGES) {
    for (const humidity of HUMIDITIES) {
      const precip    = ['rainy','pouring','snowy','snowy-rainy','hail','lightning-rainy'].includes(condition) ? 0.5 : 0;
      const uv_index  = humidity < 50 ? 7 : 3;
      const temperature = 70;

      const f = { condition, cloud_coverage, humidity, precipitation: precip, uv_index, temperature };
      const got      = inferCloudType(f);
      const expected = groundTruth(f);
      const match    = got === expected;
      if (match) correct++; else wrong++;
      if (!match) rows.push({ condition, cloud_coverage, humidity, expected, got });
    }
  }
}

// ── Output ────────────────────────────────────────────────────────────────────

const total = correct + wrong;
console.log(`\nCloud inference accuracy: ${correct}/${total} (${Math.round(correct/total*100)}%)\n`);
console.log('MISMATCHES:\n');

// Group by condition for readability
const byCondition = {};
for (const r of rows) {
  (byCondition[r.condition] ??= []).push(r);
}

const COL = { condition: 18, cov: 5, hum: 5, expected: 15, got: 15 };
const header =
  'condition'.padEnd(COL.condition) +
  'cov%'.padEnd(COL.cov) +
  'hum%'.padEnd(COL.hum) +
  'expected'.padEnd(COL.expected) +
  'got';
console.log(header);
console.log('-'.repeat(header.length));

for (const [cond, entries] of Object.entries(byCondition)) {
  for (const r of entries) {
    console.log(
      r.condition.padEnd(COL.condition) +
      String(r.cloud_coverage).padEnd(COL.cov) +
      String(r.humidity).padEnd(COL.hum) +
      r.expected.padEnd(COL.expected) +
      r.got
    );
  }
}

// Summary by condition
console.log('\nMISMATCH COUNT BY CONDITION:\n');
for (const [cond, entries] of Object.entries(byCondition)) {
  console.log(`  ${cond.padEnd(20)} ${entries.length} mismatches`);
}
