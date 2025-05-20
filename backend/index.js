// index.js
import { startServer } from './server/index.js';
// import { startSimLoop } from './sim/tick.js';
import { loadWorldConfig } from './sim/configLoader.js';

// let world = loadWorldConfig('configs/sampleWorld.json');
const broadcast = startServer();
// startSimLoop(world, broadcast);
