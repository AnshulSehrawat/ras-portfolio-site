// copy for the desk (the "S" = self room). first person, from the owner's CV + VOICE.md.
// facts only from the CV: self-taught, artistic background, 2 years of static ads, learned-from list,
// niches, clients (site.clients). no invented numbers, dates, results or quotes.
export const desk = {
  kicker: '(S) = self',
  room: 'the desk',
  role: 'designer / artist',
  pencil: [
    'my desk. yes it always looks like this.',
    'touch whatever you want. just don\'t move the coffee.',
  ],

  about: {
    title: 'about me',
    sub: '(the short version)',
    paras: [
      'hey. i design stuff (mostly DTC static ads, listings, merch, logos, websites) and i draw stuff.',
      'self-taught. no design school. i learned by doing it wrong first. many times.',
      'but i come from an artistic background, so colour, hierarchy, composition, storytelling and type are kinda baked in.',
      'gut first, then fundamentals. the gut is ridiculously strong. the fundamentals make sure the work actually works.',
      'i\'m a sponge. whatever i don\'t know, i learn.',
      'i care about tiny details to a slightly silly degree. but we\'re here to sell things, not just make modern art. i know how to balance the two.',
    ],
    sign: 'anshul',
    margin: ['true story', 'it\'s a lot'],
  },

  // the history, as a till receipt. qty column = real facts or honest words, never made-up numbers.
  receipt: {
    shop: 'RA.S DESK SUPPLY',
    tag: 'one designer, assembled by hand',
    items: [
      ['artistic background', '1'],
      ['design school', '0'],
      ['learning by doing', 'lots'],
      ['static ad game', '2 yrs'],
      ['creatives made', 'a massive pile'],
      ['gut instinct', 'strong af'],
      ['design fundamentals', 'incl.'],
      ['care for tiny details', 'silly'],
    ],
    total: ['TOTAL', '1 designer who\'s actually into design'],
    paid: ['PAID', 'in coffee'],
    bye: 'thank you. come again (pls)',
  },

  notes: [
    'fix kerning. (again.)',
    'make logo bigger? NO.',
    'reference ≠ copy. same vibe, not ditto.',
    'is it ai slop? be honest.',
    'readable at small size??',
    'one idea per ad. ONE.',
    'drink water. not coffee. ok coffee.',
    'delete 40 layers named "Layer 1 copy 3"',
    'sleep at some point??',
    'it\'s boring but it works → make it not boring.',
  ],

  mugNope: ['nope. the coffee stays.', 'i said don\'t.', 'ok you\'re persistent. still no.', 'that\'s my coffee bro.'],

  phone: [
    { me: true, t: 'hi. got a product that deserves better ads?' },
    { me: true, t: 'lmk. i reply faster than my renders.' },
  ],

  badge: {
    org: 'RA.S',
    dept: 'self dept.',
    photoNote: 'not a photo. a drawing i made.',
    access: 'access: all areas (not the coffee)',
    valid: 'valid until further notice',
  },

  contact: {
    ask: 'wanna work together?',
    line: 'if you need a designer who\'s actually into design, let\'s talk.',
    checkTitle: 'what are we making? tick a few, i\'ll read it twice.',
    other: 'something else',
    send: 'send it',
    foot: 'say hi. worst case we talk about fonts for an hour.',
  },
};
