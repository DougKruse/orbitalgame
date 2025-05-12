// index.js
import { startServer } from './server/index.js';
// import { startSimLoop } from './sim/tick.js';
import { loadConfig } from './sim/configLoader.js';

let world = loadConfig('configs/sampleWorld.json');
const broadcast = startServer();
// startSimLoop(world, broadcast);
