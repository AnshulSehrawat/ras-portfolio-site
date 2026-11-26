// the diary's own copy. every angle note below describes only what is visible in the ad itself
// (its headline, its body line, its props). no results, no numbers that aren't printed in the ad, no brand names.
export const diary = {
  label: 'diary / design',
  vol: 'vol. A · ads',
  title: 'the diary.',
  hook: 'every ad in here had one job: stop the thumb, then sell the thing.',
  aIsAds: 'you came in through the A. A = ads.',

  // chapter tabs on the page edge
  tabs: [
    { id: 'spreads', label: 'spreads', c: 'yellow' },
    { id: 'rolodex', label: 'rolodex', c: 'blue' },
    { id: 'rules', label: 'rules', c: 'paper' },
    { id: 'log', label: 'client log', c: 'ink' },
    { id: 'pocket', label: 'back pocket', c: 'white' },
  ],

  spreadsIntro: {
    title: 'one idea,', titleB: 'many hooks.',
    note: 'fewer, deeper. each spread is one idea and the hooks i built off it. the circled numbers on the print match the notes.',
  },

  // hero = the big print, sibs = the other hooks of the same idea. marks = circled numbers on the hero (x/y in %).
  spreads: [
    {
      id: 'cpw', tag: 'cost per wear', title: 'a quarter per wear.',
      from: 'price', to: 'cost per wear',
      hero: 'b08', sibs: ['b06', 'b07', 'b09'],
      notes: [
        'price is the objection. so i never argued with it. i <u>divided</u> it.',
        '$39 ÷ 156 wears = $0.25. one sum, four machines: vending, break-glass, claw, washer.',
        'the cheap tee gets a bill too. $25 worn twice is $12.50 a wear.',
        'the copy stays plain on purpose. the <u>scene</u> does the shouting.',
      ],
      marks: [{ n: 1, x: 80, y: 21 }, { n: 2, x: 67, y: 50 }, { n: 3, x: 50, y: 72 }],
      aside: 'same maths, 4 rooms',
    },
    {
      id: 'scenes', tag: 'recognition scenes', title: 'same plates since february.',
      from: 'a symptom', to: 'a scene he has lived',
      hero: 'b23', sibs: ['b27', 'b26'], strip: ['b24', 'b25', 'b28'],
      notes: [
        'don\'t sell the jar. sell the <u>moment</u> he already knows.',
        'plates that haven\'t moved in months. the 3pm crash. the 6:00 alarm.',
        'then take the blame off him: "the program was fine. the chemistry was capped."',
        'one line, three rooms. gritty, clean, wide.',
      ],
      marks: [{ n: 1, x: 50, y: 18 }, { n: 3, x: 50, y: 92 }],
      pins: ['6:00 am', '3 pm', 'since feb.'],
      aside: 'strung in the order his day goes',
    },
    {
      id: 'date', tag: 'second date', title: 'she won\'t fall for it twice.',
      from: 'a 2-colour bundle', to: 'a dating joke',
      hero: 'b05', sibs: ['b04'],
      notes: [
        'a 2-colour bundle is boring. a <u>second date</u> isn\'t.',
        'the joke sets up the offer: same shirt twice? change the colour. 2 for $59.',
        '"the shirt, we mean." the line that makes it land.',
        'this one was already a diary page. i just put it back.',
      ],
      marks: [{ n: 2, x: 50, y: 89 }, { n: 4, x: 84, y: 49 }],
      aside: 'the punchline is the price',
    },
    {
      id: 'lineup', tag: 'callouts', title: 'three of these are lying.',
      from: 'a fit claim', to: 'a line-up you judge',
      hero: 'b13', sibs: ['b14', 'b16', 'b15'],
      notes: [
        'put the bad fits in the <u>same frame</u> and let the reader play judge.',
        'every wrong cut gets a one-line roast. "cut like a pop can." "trend now, cardboard forever."',
        'the right one gets the plain truth: "the one built around your shape."',
        'same trick, two generations: "sorry son. different league." the joke lands on the son, the sale on the dad.',
      ],
      marks: [{ n: 1, x: 50, y: 11 }, { n: 2, x: 60, y: 31 }, { n: 3, x: 61, y: 86 }],
      aside: 'roast the cut. the guy just stands there.',
    },
    {
      id: 'not', tag: 'this is not', title: 'this is not roids.',
      from: 'the scary word', to: 'said first',
      hero: 'b34', sibs: ['b32', 'b33'],
      notes: [
        'say the scary word before he does. <u>then</u> the "but".',
        '"this is not TRT. but it pushes you like hell."',
        'one template, only the headline moves. that\'s how you find out which hook pulls.',
        'the icons do the boring proof. the headline does the fighting.',
      ],
      marks: [{ n: 1, x: 50, y: 18 }, { n: 2, x: 50, y: 36 }, { n: 4, x: 16, y: 60 }],
      aside: 'A / B / C. same layout.',
    },
    {
      id: 'studio', tag: 'content studio', title: 'your bedroom isn\'t a content studio.',
      from: 'rent a room', to: 'permission',
      hero: 'b45', sibs: ['b43', 'b44'],
      notes: [
        'call out where she shoots now. no shame, just "and it shouldn\'t have to be."',
        'soft voice, hard structure: clean. styled. professional. then book now.',
        'the headline bends round the arch. the <u>type</u> is part of the set.',
        'three takes on one line: stacked, standing, curved.',
      ],
      marks: [{ n: 1, x: 70, y: 36 }, { n: 2, x: 14, y: 56 }, { n: 3, x: 40, y: 22 }],
      aside: 'quiet register. still a callout.',
    },
  ],

  rolodex: {
    title: 'the rolodex.',
    sub: 'every register i work in. flick through.',
    hint: 'drag the cards, or just scroll',
    cards: [
      { id: 'b03', reg: 'clean', note: 'the tees spell FIT. no model needed.' },
      { id: 'b31', reg: 'quirky', note: 'a renaissance painting, selling a jar. "evolve beyond the cubicle."' },
      { id: 'b40', reg: 'premium', note: 'type as big as the guy. "the natural anabolic."' },
      { id: 'b12', reg: 'callout', note: '"dad bod is a marketing word." then: we build shirts for the bodies behind them.' },
      { id: 'b35', reg: 'quirky', note: 'before / after, drawn. no stock photo could tell this joke.' },
      { id: 'b50', reg: 'premium', note: 'a monthly membership, sold as a ritual.' },
      { id: 'b30', reg: 'quirky', note: '"suspect: your age. not guilty." an interrogation room for a hormone.' },
      { id: 'b54', reg: 'status', note: '"look like you\'ve won." the shirt as the trophy.' },
      { id: 'b18', reg: 'clean', note: '"90% of your fit is the solid tee." three outfits, one tee.' },
      { id: 'b29', reg: 'story', note: 'captions only. reads like a guy talking, not an ad.' },
      { id: 'b39', reg: 'proof', note: 'the ingredient list, printed as a receipt.' },
      { id: 'b10', reg: 'offer', note: 'buy 3 get 3. one offer, dressed for every season.' },
      { id: 'b41', reg: 'premium', note: 'same line as the loud one. darker room, quieter.' },
      { id: 'b22', reg: 'callout', note: '"he\'s still in there. go get him."' },
      { id: 'b46', reg: 'offer', note: 'polaroids point at what\'s in the set. plus a free tee.' },
      { id: 'b38', reg: 'proof', note: 'a day-by-day timeline. the wait, made visible.' },
      { id: 'b55', reg: 'clean', note: '"tired of bad fits?" nine crops, all fabric.' },
      { id: 'b58', reg: 'status', note: '"your lifts went up. time your gear did too."' },
      { id: 'b36', reg: 'proof', note: 'every ingredient gets one line and one job.' },
      { id: 'b48', reg: 'loud', note: 'orange, caps, capsules flying. loud on purpose.' },
      { id: 'b17', reg: 'clean', note: '"men\'s fashion starts with good basics."' },
      { id: 'b51', reg: 'premium', note: 'closer crop. same ritual.' },
    ],
  },

  rules: {
    title: 'how i think', titleB: 'about ads.',
    list: [
      { r: 'stop the thumb first.', g: 'nobody buys from an ad they scrolled past.' },
      { r: 'one idea per ad. ONE.', g: 'two ideas = zero ideas.' },
      { r: 'make it make sense.', g: 'if it needs explaining, it already lost.', draft: 'make it pretty.' },
      { r: 'readable at thumbnail size.', g: 'or it doesn\'t exist. i squint at every one.' },
      { r: 'real beats polished.', g: 'real light, real rooms. not studio, not slop.' },
      { r: 'pretty that doesn\'t sell doesn\'t count.', g: 'we\'re here to sell things, not just make modern art. i know how to balance the two.' },
    ],
  },

  log: {
    title: 'the client log.',
    sub: 'brands that trusted me with their ads.',
    niches: 'niches',
    learned: 'where the strategy comes from',
    services: 'hire me for',
    numbers: 'numbers? ask me on a call.',
  },

  pocket: {
    left: 'that\'s the neat part.',
    leftB: 'the rest is in the back pocket. the good, the ok-ish, the loud.',
    label: 'the back pocket',
    pull: 'pull it all out',
    title: 'the back pocket.',
    close: 'put it back',
    empty: 'nothing in this pile. try another filter.',
  },
};
