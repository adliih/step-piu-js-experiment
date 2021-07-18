class NoteData {
    key;
    description;
    notes = [];
};

class Note {
    receptorIndex;
    type;
    hitBeat;
    hitTime;
};

// Monstly inspired from https://github.com/stepmania/stepmania/wiki/Note-Types
const NOTE_TYPE = {
    NULL            : '0',
    TAP             : '1',
    HOLD_HEAD       : '2',
    HOLD_ROLL_END   : '3',
    ROLL_HEAD       : '4',
    MINE            : 'M',
    LIFT            : 'L',
    FAKE            : 'F',
}

export {
    NoteData,
    Note,
    NOTE_TYPE,
}