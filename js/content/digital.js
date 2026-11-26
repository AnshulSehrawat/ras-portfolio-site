// the digital drawer: everything in it is data. the section reads this file and builds the desktop.
//
// ADDING A REAL VIDEO (that's the whole job):
//   1. put the file in media/digital/ (mp4, h.264, muted is fine, ~1080px wide is plenty)
//   2. add one line to `items`:
//      { id: 'night-swim', title: 'night_swim', folder: 'clips', kind: 'video',
//        src: 'media/digital/night-swim.mp4', poster: 'media/digital/night-swim.jpg', w: 1080, h: 1920 },
//   poster can be a file path or an art id from media.js ('a30'). w/h are optional (read from the video).
//   the same player plays it: play/pause, scrub, timecode, frame counter. nothing else to touch.
//
// kinds: 'video' (src), 'frames' (frames: [art ids], played as a stepped sequence), 'still' (one image).
// fps / blend only matter for 'frames': fps = playback speed, blend = crossfade between frames.
// note = one honest line about what you can see in it. never invent facts here.

export const drawer = {
  folders: [
    { id: 'clips', label: 'clips', note: 'moving stuff' },
    { id: 'experiments', label: 'experiments', note: 'tests that stayed' },
    { id: 'stills', label: 'stills', note: 'single frames' },
  ],

  items: [
    // ---- clips (frame sequences for now, swap in the mp4s when they're exported) ----
    { id: 'flame-face', title: 'flame_face', folder: 'clips', kind: 'frames',
      frames: ['a30', 'a31', 'a32', 'a33', 'a34', 'a35', 'a36', 'a37', 'a38'], fps: 8, blend: false,
      note: 'one profile, nine looks. it flickers on purpose.' },
    { id: 'cats-wall', title: 'cats_on_a_wall', folder: 'clips', kind: 'frames',
      frames: ['a15', 'a16', 'a17', 'a18', 'a19', 'a20', 'a21'], fps: 4, blend: true,
      note: 'two cats, one wall, the light keeps changing.' },
    { id: 'ink-storm', title: 'ink_storm', folder: 'clips', kind: 'frames',
      frames: ['a26', 'a27'], fps: 6, blend: false,
      note: 'black ink, white ink, back again.' },
    { id: 'wolf', title: 'wolf_3_grades', folder: 'clips', kind: 'frames',
      frames: ['a03', 'a04', 'a05'], fps: 3, blend: false,
      note: 'same frame, three grades. picking one is the hard part.' },
    { id: 'sword', title: 'sword_retake', folder: 'clips', kind: 'frames',
      frames: ['a10', 'a11'], fps: 2, blend: true,
      note: 'take one, take two. guess which one i kept.' },

    // ---- experiments ----
    { id: 'glitch', title: 'glitch_hero', folder: 'experiments', kind: 'still', frames: ['a02'],
      note: 'two figures mid-air, broken on purpose.' },
    { id: 'tower', title: 'tower_blur', folder: 'experiments', kind: 'still', frames: ['a28'],
      note: 'a tower, moving faster than the camera.' },
    { id: 'red-black', title: 'red_black', folder: 'experiments', kind: 'still', frames: ['a29'],
      note: 'red, black, white. nothing else allowed in.' },

    // ---- stills ----
    { id: 'boxer', title: 'boxer', folder: 'stills', kind: 'still', frames: ['a06'],
      note: 'guard up, mid-step.' },
    { id: 'cloud-kid', title: 'cloud_kid', folder: 'stills', kind: 'still', frames: ['a25'],
      note: 'a kid and a very big cloud.' },
    { id: 'fire-kid', title: 'fire_kid', folder: 'stills', kind: 'still', frames: ['a39'],
      note: 'gloves on. on fire. calm.' },
  ],

  // the owner's own words (VOICE.md, digital intros)
  readme: [
    'short videos i made with AI and a lot of re-tries.',
    'i\'m not an "AI artist". AI is a tool, like a brush that sometimes paints a third hand. i pick, it renders, i fix.',
    'AI is not 100% predictable. that\'s the fun part. this drawer is the stuff that survived.',
  ],
  trash: 'emptied. taste picks, the machine renders, i throw away the slop.',
};
