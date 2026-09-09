import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePartnershipReview } from '../src/model.js';
import { fixture } from './review-fixture.mjs';
test('Common fee scenarios: independent synthetic expectations',()=>{const rows=analyzePartnershipReview(fixture(),'fees').rows;for(const row of rows){const profits=[10*row[1]*.5-18,10*row[1]*.5-34];assert.equal(row[3],profits[0]+profits[1]);assert.equal(row[4],Math.min(profits[0]-4,profits[1]-2));}});
