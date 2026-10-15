You arrange the senses of one part of speech of a dictionary word, taken from Wiktionary, the way the New Oxford American Dictionary does.

Oxford organizes each part of speech into a few core senses, each with subsenses under it. A core sense is the most literal, central meaning of the word in modern use: not necessarily the oldest, and not necessarily the most frequent, since figurative senses are sometimes more frequent. Each subsense belongs under the core sense it comes from: a figurative extension of it, a special case of it, or another shift that keeps part of its meaning. Most senses come from one of the core meanings, including figurative, specialized, and slang uses, and belong under it. A sense with no clear link to any core's meaning, such as one that comes from a different idea, is a core sense of its own; Oxford's entries often end with a few small cores like these.

Order core senses from the most central in modern use to the least, and order each core's subsenses the same way. Rare, archaic, and technical senses go after common ones.

The input gives the `word`, its `partOfSpeech`, and its `senses`. Each sense has an `id`, its `definition`, and sometimes Wiktionary's `labels`, such as "obsolete", "slang", or "chess"; some list `subsenses` of their own, which stay with them and need no placing. Use every id exactly once, either as a core sense or as a subsense. Don't write or change definitions.

## How many core senses

Use as few core senses as the meanings allow. Most parts of speech need one to four; even entries with dozens of senses rarely need more than six or seven. Before making a sense a core of its own, check whether it is a narrower, technical, figurative, older, or slang use of an existing core's idea; if so, it is a subsense of that core.

- A sense used in one field ("in geometry", "in cricket", "in music") is a subsense of the general sense it specializes.
- An obsolete, archaic, or dialect sense goes under the core whose idea it shares.
- A unit of measure, a person, an object, or a place named after a core meaning goes under that core.
- Only a meaning that shares nothing with any core becomes a core of its own, near the end.

## Example

Input:
{"word":"crown","partOfSpeech":"noun","senses":[{"id":"1","definition":"A royal headdress, usually of gold and jewels."},{"id":"2","definition":"The monarchy; the reigning monarch."},{"id":"3","definition":"The top of the head."},{"id":"4","definition":"The top part of a hat."},{"id":"5","definition":"(dentistry) An artificial cover for a damaged tooth."},{"id":"6","definition":"(historical, UK) A coin worth five shillings."},{"id":"7","definition":"A championship title."},{"id":"8","definition":"A wreath worn as a mark of honor.","labels":["archaic"]},{"id":"9","definition":"The upper branches of a tree."}]}

Output:
{"cores":[{"id":"1","subsenses":["8","2","7"]},{"id":"3","subsenses":["4","9","5"]},{"id":"6","subsenses":[]}]}

The headdress is the central meaning; the wreath is an older kind of it, and the monarchy and a title are what it stands for. The top of the head is a second idea, with other tops under it. The coin shares neither idea closely enough, so it is a small core at the end.
