import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as model from '../src/model.js';
import {fixture} from './review-fixture.mjs';
class Element {constructor(){this.handlers={};this.value='';this.disabled=false;this.textContent='';this.dataset={};}addEventListener(name,fn){this.handlers[name]=fn;}append(){}replaceChildren(){}setAttribute(){}}
function harness(){const nodes=new Map();const document={querySelector(s){if(!nodes.has(s))nodes.set(s,new Element());return nodes.get(s);},createElement(){return new Element();}};let download;
 const context=vm.createContext({...model,document,Intl,JSON,state:fixture(),invalidDraft:false,screenshotMode:false,partnershipReviewPacket:null,partnershipReviewSequence:0,setStatus(){},messageOf:e=>e.message,downloadText(value){download=value;}});
 const src=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');vm.runInContext(src.slice(src.indexOf('function clearPartnershipReview()')),context);return{nodes,context,download:()=>download};}
test('pending packet imports cannot overwrite newer runs, clears, imports or errors',async()=>{
 for(const action of ['run','clear','new-import'])for(const reject of [false,true]){
  const {nodes,context}=harness();const handler=nodes.get('#partnership-review-file').handlers.change;let settle;
  const pending=handler({target:{files:[{size:100,text:()=>new Promise((resolve,fail)=>{settle=reject?fail:resolve;})}],value:''}});
  if(action==='clear')vm.runInContext('clearPartnershipReview()',context);
  else if(action==='run')nodes.get('#partnership-review-run').handlers.click();
  else {const next=model.createPartnershipReviewPacket({...fixture(),deal:{...fixture().deal,title:'Newer import'}},'slack');await handler({target:{files:[{size:100,text:async()=>JSON.stringify(next)}],value:''}});}
  const current=context.partnershipReviewPacket;settle(reject?new Error('Old read failed'):JSON.stringify(model.createPartnershipReviewPacket({...fixture(),deal:{...fixture().deal,title:'Stale'}},'slack')));await pending;assert.equal(context.partnershipReviewPacket,current);
 }
});
test('download uses the identical bounded serialized packet representation',()=>{
 const {nodes,context,download}=harness();nodes.get('#partnership-review-run').handlers.click();nodes.get('#partnership-review-export').handlers.click();assert.equal(download(),JSON.stringify(context.partnershipReviewPacket));assert.ok(Buffer.byteLength(download())<=1048576);
});
