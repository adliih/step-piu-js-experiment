/**
 * Most of the logic here are ported from
 * https://github.com/racerxdl/piuvisual/blob/master/jspump/sscparser.js
 */

import { NoteData, NOTE_TYPE, Note } from '../struct.js';

const RECEPTOR_COUNT = {
    'pump-single': 5,
    'pump-double': 10,
}

const FIELD = {
    NOTES: '#NOTES',
    DESCRIPTION: '#DESCRIPTION',
    BPMS: '#BPMS',
    OFFSET: '#OFFSET',
    STEPSTYPE: '#STEPSTYPE',
}

const SSC_NOTE_TYPE_MAP = {
    "0": NOTE_TYPE.NULL,
    "1": NOTE_TYPE.TAP,
    "2": NOTE_TYPE.HOLD_HEAD,
    //"H" : NOTE_TYPE.HoldBody,
    "3": NOTE_TYPE.HOLD_ROLL_END,
    "M": NOTE_TYPE.MINE,
    "F": NOTE_TYPE.FAKE,
    "^": NOTE_TYPE.MINE,             //  Convert from 1*F to ^
}

class SscBeatData {
    bpm;
    startBeat = 0;
    endBeat = 999999;
    // Time in seconds
    startTime = 0;
    endTime = 9999999;

    getBPS() {
        return this.bpm / 60;
    }

    getTimeFromBeat(beat) {
        if (
            beat < beat.startBeat ||
            beat > beat.endTime
        ) {
            // Not from this beat range.
            // Please continue to look in another beat range.
            return null;
        }
        return this.startTime + (beat - this.startBeat) / this.getBPS();
    }
}

function parse(text) {
    let noteData = {};
    // Step Level splitter
    let stepLevelSplitter = /\/\/--+.*--+/;
    let stepLevels = text.split(stepLevelSplitter);
    // Skip first split.
    // Because it's only used for song metadata.
    stepLevels.shift();
    for (let stepLevel of stepLevels) {
        // Cleanup comments
        stepLevel = stepLevel.replaceAll(/\/\/.*/ig, '');

        // Replace note that were bracket
        // because i don't know what that means
        // e.g
        // {M|n|1|0}
        // {3|n|1|0}
        // Will only use the second char
        stepLevel = stepLevel.replaceAll('{', '').replaceAll(/\|.*}/ig, '');

        let datum = new NoteData();
        let bpms, notes, offset;
        for (const stepRow of stepLevel.split(';')) {
            let [key, value] = stepRow.trim().split(':', 2);
            switch (key) {
                case FIELD.DESCRIPTION:
                    datum.description = value;
                    datum.key = value;
                    break;
                case FIELD.STEPSTYPE:
                    datum.receptorCount = RECEPTOR_COUNT[value];
                    break;
                case FIELD.NOTES:
                    notes = value.split(',').map((str) => str.trim());
                    break;
                case FIELD.BPMS:
                    bpms = parseBPMS(value);
                    break;
                case FIELD.OFFSET:
                    offset = parseInt(value);
                    break;
                default:
                    continue;
            }
        }
        if (!datum.description) {
            continue;
        }
        datum.notes = parseNotes(notes, bpms);
        noteData[datum.key] = datum;
    }
    return noteData;
}

function parseNotes(rawNotes, bpms) {
    let result = [];

    // Beat counter
    let currentBeat = 0.0;

    // rawNotes comes already spliited for each measurement
    for (let measurement of rawNotes) {
        measurement = measurement.trim();
        let notesInMeasurements = measurement.split('\n');
        // Split every beat
        for (let rawNote of notesInMeasurements) {
            rawNote = rawNote.trim();
            currentBeat += 1 / (notesInMeasurements.length / 4);
            for (let noteIndex = 0; noteIndex < rawNote.length; noteIndex++) {
                let noteType = SSC_NOTE_TYPE_MAP[rawNote[noteIndex]];
                if (noteType == undefined) {
                    // Not mapped yet
                    console.error('Not Mapped Type', rawNote, noteIndex);
                }
                if (noteType == NOTE_TYPE.NULL) {
                    // Skip null note type
                    continue;
                }
                let note = new Note();
                note.receptorIndex = noteIndex;
                note.type = noteType;
                note.hitBeat = currentBeat;
                note.hitTime = findTimeFromBeat(currentBeat, bpms);
                result.push(note);
            }
        }
    }
    return result;
}

function findTimeFromBeat(beat, bpms) {
    for (let bpm of bpms) {
        let time = bpm.getTimeFromBeat(beat);
        if (time != null) {
            return time;
        }
    }
    return null;
}

function parseBPMS(rawBPMS) {
    let result = [];
    for (let [i, rawBPM] of rawBPMS.split(',').entries()) {
        let [beatTiming, bpm] = rawBPM.trim().split('=', 2);

        let beatData = new SscBeatData();
        result.push(beatData);

        beatData.bpm = parseInt(bpm);
        beatData.startBeat = parseFloat(beatTiming);

        if (i > 0) {
            let prevBeatData = result[i - 1];
            prevBeatData.endBeat = beatData.startBeat;

            let intervalTime = (prevBeatData.endBeat - prevBeatData.startBeat) / prevBeatData.getBPS();
            prevBeatData.endTime = prevBeatData.startTime + intervalTime;

            beatData.startTime = prevBeatData.endTime;
        }

    }
    return result;
}

export {
    parse,
    // Private, for testing
    parseBPMS,
    parseNotes,
}

