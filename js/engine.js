
class Engine {
    g;
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
        receptor.setPivot(0.5, 0.5);
        return receptor;
    }
}

export {
    Engine
}