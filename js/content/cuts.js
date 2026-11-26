// the three sites are the same blocks in a different order.
// 'gate:<mark>><world>' = a return to RA.S, drawn with one of the owner's marks, that zooms into <world>.
export const cuts = {
  all: ['hello', 'gate:patch>diary', 'diary', 'split', 'gate:grid>sketchbook', 'sketchbook', 'wardrobe',
    'gate:block>digital', 'digital', 'loupe', 'gate:rags>desk', 'desk', 'inside', 'outro'],
  ecom: ['hello', 'gate:patch>diary', 'diary', 'loupe', 'gate:block>digital', 'digital', 'gate:rags>desk', 'desk', 'outro'],
  art: ['hello', 'gate:grid>sketchbook', 'sketchbook', 'wardrobe', 'gate:block>digital', 'digital', 'split',
    'gate:rags>desk', 'desk', 'inside', 'outro'],
};

// labels for the care-label index
export const labels = {
  hello: 'hello', split: 'designer | artist', wardrobe: 'no one style', loupe: 'tiny details',
  diary: 'the diary · design', sketchbook: 'the sketchbook · art', digital: 'the digital drawer', desk: 'the desk · me',
  inside: 'inside', outro: 'the end',
};
