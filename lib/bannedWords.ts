export const BANNED_WORDS = [
    "fuck",
    "fucked",
    "fucking",
    "fucker",
    "shitty",
    "bitch",
    "bitches",
    "bitching",
    "ass",
    "asshole",
    "bastard",
    "damned",
    "cunt",
    "randi",
    "randii",
    "kutti",
    "kuttiya",
    "gandu",
    "madarchod",
    "behenchod",
    "bhenchod",
    "chutiya",
    "jerk",
    "jerkass",
    "prick",
    "dick",
    "dickhead",
    "motherfucker",
    "son of a bitch",
    "trash",
    "bullshit",
    "arse",
    "arsehole",
    "kutti",
    "*",
];

export const OBFUSCATION_PATTERNS = [
    { pattern: /[1!]/g, replace: "i" },
    { pattern: /[3]/g, replace: "e" },
    { pattern: /[4@]/g, replace: "a" },
    { pattern: /[5s$]/g, replace: "s" },
    { pattern: /[7]/g, replace: "t" },
    { pattern: /[0o]/g, replace: "o" },
    { pattern: /[8]/g, replace: "b" },
];

export function containsBannedWords(text: string | null | undefined): { contains: boolean; bannedWord?: string } {
    if (!text || typeof text !== 'string') return { contains: false };

    let processedText = text.toLowerCase();

    processedText = processedText
        .replace(/[_\-\.\*\[\]\(\)]/g, "")
        .replace(/\s+/g, "")
        .replace(/[0-9]/g, (match) => {
            const numberMap: { [key: string]: string } = {
                "0": "o",
                "1": "i",
                "3": "e",
                "4": "a",
                "5": "s",
                "7": "t",
                "8": "b",
            };
            return numberMap[match] || match;
        });

    for (const bannedWord of BANNED_WORDS) {
        if (!bannedWord || typeof bannedWord !== 'string') continue;

        const cleanBannedWord = bannedWord
            .toLowerCase()
            .replace(/[_\-\.\*\[\]\(\)]/g, "")
            .replace(/\s+/g, "");

        if (cleanBannedWord && processedText.includes(cleanBannedWord)) {
            return { contains: true, bannedWord };
        }
    }

    return { contains: false };
}

export function censorWord(word: string): string {
    if (word.length <= 2) return "*".repeat(word.length);
    return word[0] + "*".repeat(word.length - 2) + word[word.length - 1];
}
