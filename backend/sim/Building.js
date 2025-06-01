class Building {
    constructor({ size, spoke, type }) {
        this.size = size;   // How many spokes it occupies
        this.spoke = spoke; // Starting spoke index
        this.type = type ?? 'generic';
        // add more as needed
    }
}

export const CanHoldBuildings = (Base) => class extends Base {
    constructor(...args) {
        super(...args);
        this.buildings = [];
    }

    NewBuilding(params) {
        // Can use instance properties for defaults/context if needed
        return new Building(params);
    }

    // Try to place a building at a spoke. Return true if placed.
    addBuilding(building) {
        if (this.canPlaceBuilding(building)) {
            building.offset = this.shape.r[building.spoke];
            this.buildings.push(building);
            return true;
        }
        return false;
    }

    // Core fit/collision check
    canPlaceBuilding(newBuilding) {
        const spokeCount = this.shape.angles.length;
        // Compute all occupied spokes for the new building (wrap around)
        const newRange = [];
        for (let i = 0; i < newBuilding.size; ++i) {
            newRange.push((newBuilding.spoke + i) % spokeCount);
        }
        // Check against all current buildings
        for (const b of this.buildings) {
            for (let i = 0; i < b.size; ++i) {
                const bSpoke = (b.spoke + i) % spokeCount;
                if (newRange.includes(bSpoke)) return false; // overlap
            }
        }
        return true;
    }

    // Optional: get which spokes are filled, or visualize
    getOccupiedSpokes() {
        const filled = new Set();
        const spokeCount = this.shape.angles.length;
        for (const b of this.buildings) {
            for (let i = 0; i < b.size; ++i) {
                filled.add((b.spoke + i) % spokeCount);
            }
        }
        return Array.from(filled).sort((a, b) => a - b);
    }

};
