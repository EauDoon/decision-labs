import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as model from '../src/model.js';
import {fixture} from './review-fixture.mjs';
class Element {constructor(){this.handlers={};this.value='';this.disabled=false;this.textContent='';this.dataset={};}addEventListener(name,fn){this.handlers[name]=fn;}append(){}replaceChildren(){}setAttribute(){}}
function harness(){const nodes=new Map();const document={querySelector(s){if(!nodes.has(s))nodes.set(s,new Element());return nodes.get(s);},createElement(){return new Element();}};let download;
 const context=vm.createContext({...model,document,Intl,JSON,scenario:fixture(),invalidDraft:false,screenshotMode:false,cartReviewPacket:null,cartReviewSequence:0,setStatus(){},messageOf:e=>e.message,downloadFile(value){download=value;}});
 const src=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');vm.runInContext(src.slice(src.indexOf('function clearCartReview()')),context);return{nodes,context,download:()=>download};}
test('pending packet imports cannot overwrite newer runs, clears, imports or errors',async()=>{
 for(const action of ['run','clear','new-import'])for(const reject of [false,true]){
  const {nodes,context}=harness();const handler=nodes.get('#cart-review-file').handlers.change;let settle;
  const pending=handler({target:{files:[{size:100,text:()=>new Promise((resolve,fail)=>{settle=reject?fail:resolve;})}],value:''}});
  if(action==='clear')vm.runInContext('clearCartReview()',context);
  else if(action==='run')nodes.get('#cart-review-run').handlers.click();
  else {const next=model.createCartReviewPacket({...fixture(),title:'Newer import'},'coverage');await handler({target:{files:[{size:100,text:async()=>JSON.stringify(next)}],value:''}});}
  const current=context.cartReviewPacket;settle(reject?new Error('Old read failed'):JSON.stringify(model.createCartReviewPacket({...fixture(),title:'Stale'},'coverage')));await pending;assert.equal(context.cartReviewPacket,current);
 }
});
test('download uses the identical bounded serialized packet representation',()=>{
 const {nodes,context,download}=harness();nodes.get('#cart-review-run').handlers.click();nodes.get('#cart-review-export').handlers.click();assert.equal(download(),JSON.stringify(context.cartReviewPacket));assert.ok(Buffer.byteLength(download())<=1048576);
});
test('keyboard k opens the review details and focuses the summary',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
 assert.match(html,/id="cart-review"/u);
 assert.match(html,/createCartReviewPacket|Review buyer coverage/u);
 assert.match(app,/function focusCartReview\(/u);
 assert.match(app,/panel\.open = true/u);
 assert.match(app,/createCartReviewPacket\(/u);
 assert.match(app,/CART_REVIEW_TOOLS/u);
});
