import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generateFestivalDeliberation,
  generateDistributorBids,
  getFestivalProfile,
} from '../src/services/festival/festivalJuryEngine.js';

test('festival jury engine builds four-pillar deliberation scores', () => {
  const movie = {
    quality: 92,
    criticScore: 88,
    audienceScore: 81,
    hype: 74,
    budget: 25000000,
  };

  const deliberation = generateFestivalDeliberation(movie, 'CANNES');

  assert.ok(deliberation);
  assert.equal(deliberation.pillars.direction > 0, true);
  assert.equal(deliberation.pillars.screenplay > 0, true);
  assert.equal(deliberation.pillars.performances > 0, true);
  assert.equal(deliberation.pillars.thematicDepth > 0, true);
  assert.equal(deliberation.totalScore >= 0 && deliberation.totalScore <= 100, true);
  assert.ok(deliberation.standingOvation.durationSeconds > 0);
  assert.ok(deliberation.juryConsensusQuote.length > 0);
});

test('festival jury engine creates competitive distributor bids', () => {
  const movie = {
    quality: 88,
    criticScore: 85,
    audienceScore: 83,
    hype: 78,
    budget: 18000000,
  };

  const bids = generateDistributorBids(movie, 'VENICE', 90);

  assert.ok(Array.isArray(bids));
  assert.ok(bids.length >= 3);
  assert.ok(bids.every((bid) => bid.amount > 0));
  assert.ok(bids.some((bid) => bid.distributor.includes('A24') || bid.distributor.includes('Netflix') || bid.distributor.includes('Focus')));
});

test('festival profile exposes the correct prestige metadata', () => {
  const profile = getFestivalProfile('SUNDANCE');

  assert.equal(profile.name, 'SUNDANCE');
  assert.equal(profile.topAward, 'GRAND_JURY_PRIZE');
  assert.equal(profile.entryFee, 250000);
  assert.ok(profile.weighting.direction > 0);
});
