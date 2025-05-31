// server.js
import express from 'express';
import { createServer } from 'http';
import { bus } from './eventBus.js';
import chokidar from 'chokidar';
import { loadWorld } from '../sim/worldLoader.js';
import { SimLoop } from '../sim/tick.js';
import { setupSocket } from './socket.js';
import { setupController } from '../sim/controller.js';

const CONFIG = 'configs/sampleWorld.json';
// const CONFIG = 'configs/generatedWorld.json';


export function startServer() {
    const app = express();
    app.use(express.static('frontend'));
    app.use('/shared', express.static('shared'));

    
    const httpServer = createServer(app);
    setupSocket(httpServer);

    let world = loadWorld(CONFIG);
    bus.emit('state', world);

    const sim = new SimLoop(world);
    setupController(sim);

    httpServer.listen(3000, () => {
        console.log('Listening on http://localhost:3000');
        sim.start();
    });

    

    // file watcher emits a reload event:
    const watcher = chokidar.watch(CONFIG, {
        ignoreInitial: true
    });

    watcher
        .on('all', (event, file) => {
            console.log('  [watcher]', event, file);
            if (event === 'change') {
                console.log(`  → reloading ${file}`);
                try {
                    const newW = loadWorld(CONFIG);
                    sim.setWorld(newW);
                    // immediate emit if you want an instant update:
                    // bus.emit('state', newW);
                    bus.emit('sendAllClients', {
                        type: 'reset',
                        payload: {}
                    });
                } catch (err) {
                    console.error('  reload error', err);
                }
            }
        })
        .on('error', err => {
            console.error('  watcher error', err);
        })
        .on('ready', () => {
            console.log('  watcher ready');
        })
    ;

}

