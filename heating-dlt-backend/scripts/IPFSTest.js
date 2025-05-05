import { createHelia } from 'helia';
import { strings } from '@helia/strings';
import {json} from '@helia/json';

const helia = await createHelia();
const j = json(helia);
const s = strings(helia);

const cid = await s.add('Hello Helia!');
const jsonCID = await j.add({name: "noah", cool: true})

console.log('CIDJSON:', jsonCID.toString());
console.log('CID:', cid.toString());

const retrievedJSON = await j.get(jsonCID);
console.log('Retrieved:', retrievedJSON);

const retrieved = await s.get(cid);
console.log('Retrieved:', retrieved); // "Hello Helia!"