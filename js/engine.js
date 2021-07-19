import { NOTE_TYPE } from './struct.js';

class Engine {
    g;
    currentlyHold = {};
    constructor(hexiGameInstance) {
        this.g = hexiGameInstance;
    }

    createReceptorSprite(index, yOffset = 0) {
        let colorMap = {
            0: 'blue',
            1: 'red',
            2: 'green',
            3: 'red',
            4: 'blue',
        };
        let receptor = this.g.rectangle(32, 32, colorMap[index % 5]);
        receptor.x = index * 64;
        receptor.y += yOffset;
        return receptor;
    }

    /**
     * Create sprite for moving target.
     * @param {Note} note
     */
    createTargetSprite(note) {
        let vy = -10;
        let yOffset = -vy * (note.hitTime * this.g.fps) + 100;
        let index = note.receptorIndex;

        let sprite = this.createReceptorSprite(index, yOffset);
        sprite.receptorIndex = index;
        sprite.vy = vy;

        if (note.type == NOTE_TYPE.HOLD_HEAD) {
            this.currentlyHold[index] = sprite;
        }

        if (note.type == NOTE_TYPE.HOLD_ROLL_END) {
            let head = this.currentlyHold[index];
            head.height += sprite.y - head.y - head.height;
            delete this.currentlyHold[index];
        }

        return sprite;
    }
}

export {
    Engine
}