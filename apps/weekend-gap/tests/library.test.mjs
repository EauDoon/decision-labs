import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SCENARIO, libraryFromJSON } from "../src/model.js";
const encode=scenarios=>JSON.stringify({format:"weekend-gap-library",version:1,scenarios});
test("library restores named copies and reports bounded repairs",()=>{
 const result=libraryFromJSON(encode([DEFAULT_SCENARIO,{...DEFAULT_SCENARIO,reserveCashAud:-1,name:"<img src=x>"}]));
 assert.equal(result.scenarios.length,2);assert.equal(result.scenarios[1].reserveCashAud,0);
 assert.equal(result.scenarios[1].name,"<img src=x>");assert.ok(result.errors.length);
});
test("library rejects corrupt or oversized state atomically",()=>{
 for(const raw of ["not json",encode([DEFAULT_SCENARIO,null]),encode(Array(13).fill(DEFAULT_SCENARIO)),"x".repeat(250001),JSON.stringify({format:"weekend-gap-library",version:2,scenarios:[]})]) assert.equal(libraryFromJSON(raw).scenarios,null);
 assert.deepEqual(libraryFromJSON(encode([])).scenarios,[]);
});
