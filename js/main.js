import { RECEPTOR_Y_OFFSET } from './config.js';
import * as SSC from './parser/ssc.js';
import { Engine } from './engine.js';

const songMap = {};
const gameConfig = {
    audio: undefined,
    noteData: undefined,
    difficulty: undefined,
};

var g = hexi(800, 600, setup);
var engine = new Engine(g);

const keyboardActions = [];
const gameScene = g.group(),
    receptors = g.group(),
    hitReceptors = g.group(),
    targets = g.group();

g.scaleToWindow();
g.start();

const EXTENSION_SSC = 'ssc';
const EXTENSION_MP3 = 'mp3';
const NOOP = function () { };

let inputSongDir = document.getElementById('song_dir');
inputSongDir.addEventListener('change', loadSongMap);

let songSelector = document.getElementById('song_select');
songSelector.addEventListener('change', selectSong);

let difficultySelector = document.getElementById('difficulty_select');
difficultySelector.addEventListener('change', selectDifficulty);

function loadSongMap() {
    let whitelistExtension = [EXTENSION_SSC, EXTENSION_MP3];

    let files = inputSongDir.files;

    for (let file of files) {
        if (!whitelistExtension.some((extension) => {
            return file.name.endsWith(extension);
        })) {
            continue;
        }
        // Get the dir from webkitRelativePath by removing the filename
        let dir = file.webkitRelativePath.slice(0, file.name.length * -1 - 1)

        if (!songMap[dir]) {
            songMap[dir] = {};
        }
        if (file.name.endsWith(EXTENSION_SSC)) {
            songMap[dir][EXTENSION_SSC] = file;
        } else {
            songMap[dir][EXTENSION_MP3] = file;
        }
    }

    showSongPicker();
}

function showSongPicker() {
    // Clear the previous option if found
    songSelector.innerHTML = '';
    songSelector.append(new Option('-', ''));

    // Fill the option with song directory
    for (const songDir in songMap) {
        songSelector.append(new Option(songDir, songDir));
    }
}

async function selectSong() {
    if (songSelector.value == '') {
        return;
    }

    // Choose audio
    let audioFile = URL.createObjectURL(songMap[songSelector.value][EXTENSION_MP3]);
    let sscFile = songMap[songSelector.value][EXTENSION_SSC];
    gameConfig.audio = makeSound(audioFile, NOOP, true);
    gameConfig.noteData = SSC.parse(await sscFile.text());
    showDifficultyPicker();
}

function showDifficultyPicker() {
    // Clear the previous option if found
    difficultySelector.innerHTML = '';
    difficultySelector.append(new Option('-', ''));

    // Fill the option with song directory
    for (const key in gameConfig.noteData) {
        difficultySelector.append(new Option(key, gameConfig.noteData[key].description));
    }
}

function selectDifficulty() {
    if (difficultySelector.value == '') {
        return;
    }

    gameConfig.difficulty = difficultySelector.value;
}
function setup() {
    keyboardActions.push(g.keyboard(49)); // 1
    keyboardActions.push(g.keyboard(50)); // 2
    keyboardActions.push(g.keyboard(51)); // 3
    keyboardActions.push(g.keyboard(52)); // 4
    keyboardActions.push(g.keyboard(53)); // 5
    keyboardActions.push(g.keyboard(54)); // 6
    keyboardActions.push(g.keyboard(55)); // 7
    keyboardActions.push(g.keyboard(56)); // 8
    keyboardActions.push(g.keyboard(57)); // 9
    keyboardActions.push(g.keyboard(48)); // 0

    for (let index = 0; index < keyboardActions.length; index++) {
        let keyboardAction = keyboardActions[index];
        keyboardAction.press = () => {
            hitReceptors.children[index].visible = true;
        };
        keyboardAction.release = () => {
            hitReceptors.children[index].visible = false;
        };
    }

    g.state = songSelection;
}

function setupReceptor(receptorCount) {
    console.debug('Setup receptor: ', receptorCount);
    // Receptors
    for (let index = 0; index < receptorCount; index++) {
        let receptor = engine.createReceptorSprite(index);
        receptors.add(receptor);
        g.pulse(receptor, 30, 0.8);
    }
    // Hit Receptor for animation purpose
    for (let index = 0; index < receptorCount; index++) {
        let receptor = engine.createReceptorSprite(index);
        hitReceptors.add(receptor);
        receptor.setScale(1.2, 1.2);
        receptor.visible = false;
    }
    gameScene.addChild(receptors);
    gameScene.addChild(hitReceptors);
    gameScene.addChild(targets);
    g.stage.putCenter(gameScene, 0, RECEPTOR_Y_OFFSET);
    console.debug('Setup receptor done');
}

function songSelection() {
    // Last choosen config is difficulty
    if (!gameConfig.difficulty) {
        return;
    }

    let noteDatum = gameConfig.noteData[gameConfig.difficulty];

    // Setup receptor
    setupReceptor(noteDatum.receptorCount);

    // // Create target sprites

    // Play the game
    g.state = play;
}

// Main Game Logic
function play() {
    moveTargets();
}

function moveTargets() {
    targets.children.forEach(target => {
        g.move(target);

        let receptorTarget = receptors.children[target.receptorIndex];
        let keyboardAction = keyboardActions[target.receptorIndex];

        if (g.hitTestRectangle(target, receptorTarget)) {
            // Enter boundary of receptor
            if (keyboardAction.isDown) {
                let accuracy = Math.abs(receptorTarget.y - target.y);

                if (g.hitTestPoint(target, receptorTarget)) {
                    targets.remove(target);
                    target.destroy();
                } else {
                    target.tint = 0x000000;
                }
            }

        }
    });
}

globalThis.g = g;
globalThis.gameConfig = gameConfig;
globalThis.receptors = receptors;
globalThis.engine = engine;
