// the sketchbook: one giant loose spread. every position is in page pixels (the page is W x H, the binding sits at W/2).
// pieces: the owner's own art from media.art. captions describe what's in the picture, nothing more.
// kinds: piece (one image) · flip (a stack you flick through) · flap (taped at the top, lift it to see the other one)
// mount: tape · corners · clip · pin · torn · staple · bare
export const book = {
  W: 5200,
  H: 3400,

  // where the scroll takes you: camera centre + zoom. the thread on the page is sewn along the same line.
  // phones see a narrow column of the page, so they get their own x for some stops.
  mobileX: { 0: 470, 1: 1950, 2: 3240, 3: 4420, 6: 520, 7: 1640, 8: 3260 },
  path: [
    [780, 560, 1.0],
    [2080, 640, 0.92],
    [3360, 640, 0.94],
    [4560, 1220, 0.8],
    [3300, 1900, 0.9],
    [1880, 1920, 0.9],
    [700, 2300, 0.8],
    [1920, 2920, 0.92],
    [3700, 2860, 0.86],
    [2600, 1700, 0],     // 0 = pull all the way out: the whole book
  ],

  items: [
    // ---------- arrival: the R ----------
    { k: 'piece', ids: ['a01'], x: 1010, y: 150, w: 560, r: 3, m: 'tape', cap: 'spider persona. a character sheet.' },
    { k: 'piece', ids: ['a50'], x: 930, y: 690, w: 290, r: -5, m: 'corners', cap: 'a guy who looks like he\'s judging your font choice. ink.' },

    // ---------- animals ----------
    { k: 'flip', ids: ['a15', 'a16', 'a17', 'a18', 'a19', 'a20', 'a21'], x: 1620, y: 240, w: 660, r: -2, m: 'clip', cap: 'two cats on a wall. same cats, different sun.' },
    { k: 'piece', ids: ['a22'], x: 2290, y: 560, w: 270, r: 6, m: 'tape', cap: 'cat with a bun on its head. no notes.' },
    { k: 'piece', ids: ['a23'], x: 1590, y: 960, w: 250, r: -8, m: 'torn', cap: 'grumpy for no reason.' },
    { k: 'piece', ids: ['a14'], x: 1930, y: 990, w: 300, r: 4, m: 'pin', cap: 'dog in a cap. live.' },

    // ---------- fire ----------
    { k: 'flip', ids: ['a30', 'a31', 'a32', 'a33', 'a34', 'a35', 'a36', 'a37', 'a38'], x: 2740, y: 220, w: 780, r: 1.5, m: 'tape', cap: 'a face made of fire. nine colourways.' },
    { k: 'piece', ids: ['a29'], x: 3640, y: 170, w: 320, r: -4, m: 'staple', cap: 'red, black, a bit of noise.' },
    { k: 'piece', ids: ['a39'], x: 3560, y: 600, w: 360, r: 5, m: 'pin', cap: 'fan art. on fire, again.' },
    { k: 'piece', ids: ['a40'], x: 2870, y: 760, w: 290, r: -3, m: 'corners', cap: 'fan art. very serious face.' },

    // ---------- ballpoint pile ----------
    { k: 'piece', ids: ['a52'], x: 4130, y: 150, w: 430, r: 4, m: 'tape', cap: 'sketchbook page. everything at once.' },
    { k: 'piece', ids: ['a58'], x: 4640, y: 330, w: 360, r: 7, m: 'clip', cap: 'sketchbook page. cats, faces, a race car.' },
    { k: 'piece', ids: ['a53'], x: 4210, y: 900, w: 600, r: -3, m: 'tape', cap: 'sketchbook spread. pencil.' },
    { k: 'piece', ids: ['a55'], x: 4080, y: 1330, w: 580, r: 2, m: 'bare', cap: 'sketchbook spread. ballpoint.' },
    { k: 'piece', ids: ['a56'], x: 4470, y: 1700, w: 560, r: -6, m: 'corners', cap: 'sketchbook spread. objects, faces, light.' },
    { k: 'piece', ids: ['a49'], x: 4060, y: 2130, w: 520, r: -2, m: 'tape', cap: 'blue pen. people waiting.' },

    // ---------- comics + boxing ----------
    { k: 'piece', ids: ['a43'], x: 2740, y: 1380, w: 360, r: -4, m: 'tape', cap: 'boxer. ink, black card.' },
    { k: 'piece', ids: ['a42'], x: 3190, y: 1320, w: 320, r: 5, m: 'pin', cap: 'fight poster. fan art.' },
    { k: 'piece', ids: ['a41'], x: 3560, y: 1440, w: 400, r: -2, m: 'torn', cap: 'four heads in a bush. sweating.' },
    { k: 'piece', ids: ['a45'], x: 2780, y: 1910, w: 440, r: 3, m: 'clip', cap: 'comic page. pencil.' },
    { k: 'piece', ids: ['a46'], x: 3300, y: 1880, w: 330, r: -6, m: 'tape', cap: 'comic page. character sketches.' },
    { k: 'piece', ids: ['a59'], x: 3700, y: 1960, w: 290, r: 4, m: 'staple', cap: 'warrior. pencil, a lot of it.' },

    // ---------- digital paintings ----------
    { k: 'flip', ids: ['a03', 'a04', 'a05'], x: 1300, y: 1450, w: 660, r: -1.5, m: 'tape', cap: 'the wolf. three colourways.' },
    { k: 'flip', ids: ['a10', 'a11'], x: 2140, y: 1360, w: 330, r: 4, m: 'clip', cap: 'a sword. two skies.' },
    { k: 'piece', ids: ['a25'], x: 1270, y: 1860, w: 360, r: -5, m: 'corners', cap: 'girl and a very big cloud.' },
    { k: 'piece', ids: ['a02'], x: 1730, y: 1900, w: 480, r: 3, m: 'tape', cap: 'spider persona, mid-air.' },
    { k: 'piece', ids: ['a06'], x: 2300, y: 1930, w: 190, r: -3, m: 'pin', cap: 'shadow boxing.' },
    { k: 'piece', ids: ['a47'], x: 2290, y: 2330, w: 230, r: 6, m: 'bare', cap: 'cave. values only.' },

    // ---------- faces ----------
    { k: 'piece', ids: ['a07'], x: 140, y: 1400, w: 420, r: -3, m: 'tape', cap: 'fan art. poster study.' },
    { k: 'piece', ids: ['a08'], x: 640, y: 1520, w: 400, r: 4, m: 'pin', cap: 'fan art. text as texture.' },
    { k: 'piece', ids: ['a09'], x: 170, y: 1960, w: 470, r: -2, m: 'corners', cap: 'fan art. "we did it."' },
    { k: 'piece', ids: ['a13'], x: 780, y: 2010, w: 170, r: 8, m: 'bare', cap: 'me? so sweet. an avatar.' },
    { k: 'piece', ids: ['a48'], x: 200, y: 2420, w: 380, r: -5, m: 'torn', cap: 'beard study. ink.' },
    { k: 'piece', ids: ['a51'], x: 660, y: 2350, w: 290, r: 3, m: 'tape', cap: 'profile. pencil.' },
    { k: 'piece', ids: ['a60'], x: 820, y: 2760, w: 360, r: -4, m: 'clip', cap: 'fan art. tribute poster.' },
    { k: 'piece', ids: ['a12'], x: 190, y: 2880, w: 330, r: 5, m: 'tape', cap: 'fur collar, big fringe.' },

    // ---------- lower right: flaps + loose ends ----------
    { k: 'flap', ids: ['a63', 'a64'], x: 2780, y: 2600, w: 620, r: -2, cap: 'mech city. line, then colour.' },
    { k: 'flap', ids: ['a26', 'a27'], x: 3560, y: 2470, w: 400, r: 4, cap: 'speed lines. ink, then inverted.' },
    { k: 'piece', ids: ['a54'], x: 4300, y: 2560, w: 540, r: -4, m: 'tape', cap: 'sketchbook spread. hats, houses, rain.' },
    { k: 'piece', ids: ['a62'], x: 1990, y: 2930, w: 270, r: -8, m: 'tape', cap: 'a cloud? a sheep? idk.' },
  ],

  // the loose sheet where the viewer draws
  guest: { x: 1260, y: 2640, w: 700, h: 560, r: -2.5 },

  // handwriting on the page. f: hand · pencil · marker. c: ink · red · green · blue
  notes: [
    { t: 'R = rough', x: 640, y: 236, f: 'marker', s: 46, c: 'red', r: -6 },
    { t: 'no grid, no brief, no client.\nthis is where i\'m allowed to go a bit crazy.', x: 330, y: 750, f: 'hand', s: 31, c: 'ink', r: -1.5, max: 560 },
    { t: 'drag the page. it\'s loose.', x: 380, y: 880, f: 'pencil', s: 42, c: 'blue', r: 3 },
    { t: 'same cats.\ndifferent sun.', x: 2010, y: 150, f: 'hand', s: 32, c: 'green', r: 4 },
    { t: 'flick it →', x: 1560, y: 760, f: 'marker', s: 30, c: 'ink', r: -7 },
    { t: 'grumpy for no reason', x: 1460, y: 1300, f: 'pencil', s: 34, c: 'ink', r: -4 },
    { t: 'too much?\nnah.', x: 3700, y: 1010, f: 'marker', s: 54, c: 'red', r: -8 },
    { t: '9 fires. 1 face.', x: 2800, y: 130, f: 'hand', s: 30, c: 'red', r: -2 },
    { t: 'ballpoint.\nno undo.', x: 4720, y: 1140, f: 'marker', s: 40, c: 'blue', r: 6 },
    { t: 'ugh the hands again', x: 4130, y: 2010, f: 'pencil', s: 36, c: 'blue', r: -3 },
    { t: 'don\'t tell the diary', x: 4640, y: 2400, f: 'hand', s: 28, c: 'red', r: 5 },
    { t: 'colour first,\nsense later', x: 1050, y: 1300, f: 'hand', s: 30, c: 'green', r: -5 },
    { t: 'two skies.\nsame sword.', x: 2480, y: 1270, f: 'pencil', s: 36, c: 'ink', r: 7 },
    { t: 'boxing phase.\nstill in it.', x: 3080, y: 1730, f: 'hand', s: 30, c: 'ink', r: -3 },
    { t: 'crazy good\n(i\'m allowed to say it, it\'s my book)', x: 160, y: 1290, f: 'pencil', s: 32, c: 'red', r: -2, max: 460 },
    { t: 'ok-ish', x: 600, y: 2280, f: 'marker', s: 30, c: 'ink', r: 9 },
    { t: 'lift me', x: 3010, y: 2520, f: 'marker', s: 32, c: 'green', r: -6 },
    { t: 'a cloud? a sheep?\nidk. kept it anyway.', x: 2010, y: 3200, f: 'pencil', s: 32, c: 'blue', r: -4 },
        { t: 'the stitches show. good.', x: 2380, y: 2980, f: 'pencil', s: 34, c: 'green', r: -90 },
  ],

  // big chaotic hand-lettered words
  words: [
    { t: 'sketch', x: 150, y: 330, s: 190, f: 'marker', c: 'ink', r: -4 },
    { t: 'book', x: 400, y: 520, s: 210, f: 'marker', c: 'green', r: 3 },
    { t: 'PLAY', x: 3060, y: 1130, s: 170, f: 'display', c: 'blue', r: -5 },
    { t: 'mess (good)', x: 1040, y: 2440, s: 92, f: 'marker', c: 'red', r: 5 },
    { t: 'keep looking', x: 3900, y: 3020, s: 120, f: 'hand', c: 'ink', r: -5 },
    { t: '02', x: 3300, y: 2990, s: 190, f: 'display', c: 'red', r: -3, multi: true },
    { t: 'कतरन', x: 4620, y: 2900, s: 120, f: 'deva', c: 'green', r: 8 },
  ],

  // stickers you can peel and move
  stickers: [
    { t: 'R', x: 120, y: 120, kind: 'big-r' },
    { t: 'no grid allowed', x: 2440, y: 900, kind: 'round', c: 'green' },
    { t: '✶', x: 3440, y: 140, kind: 'star', c: 'yellow' },
    { t: 'ok-ish ✓', x: 4890, y: 1980, kind: 'oval', c: 'red' },
    { t: 'made by hand', x: 950, y: 2300, kind: 'stamp', c: 'blue' },
    { t: 'scraps', x: 4650, y: 2780, kind: 'label', c: 'paper' },
  ],

  // crayon marks baked into the page: [x, y, w, h, colour, kind]
  crayon: [
    [1580, 200, 760, 600, 'green', 'zig'],
    [2700, 160, 900, 620, 'yellow', 'blob'],
    [4000, 1180, 720, 520, 'blue', 'hatch'],
    [3040, 1080, 520, 300, 'yellow', 'scrub'],
    [1000, 2380, 560, 220, 'red', 'loop'],
    [3460, 2380, 700, 640, 'green', 'scrub'],
    [80, 1300, 560, 160, 'red', 'zig'],
  ],
};
