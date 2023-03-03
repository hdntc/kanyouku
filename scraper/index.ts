import * as puppeteer from "puppeteer";

/**
 * Normalizes a string with combining dakuten or handakuten so that there are no extra "combining" characters
 * @param unnorm The string with combining dakuten or handakuten
 * @returns The string with the dakuten/handakuten removed
 */
const normalizeDakuten = (unnorm: string) => {
    const DAKUTEN_HANDAKUTEN: [number, number] = [12441, 12442];
    let result = "";
    
    Array.from(unnorm).forEach((character, index) => {
        const currentCharCode = character.charCodeAt(0);
        const nextCharCode = unnorm.charCodeAt(index + 1);
        let nextChar = "";

        if(DAKUTEN_HANDAKUTEN.includes(currentCharCode)) { // When we find a combining dakuten or handakuten
            const plainCharCode = unnorm.charCodeAt(index-1); // Get character code of kana w/o dakuten
            let newCharCode: number;
            
            if(currentCharCode === 12441) { // If the character has a dakuten
                newCharCode = plainCharCode + 1; // In the hiragana range 0x30F0 - 0x309F in unicode, the dakuten version of a kana comes after the plain version
            } else {
                newCharCode = plainCharCode + 2; // For handakuten, its +2
            }

            nextChar = String.fromCharCode(newCharCode);
        } else if(DAKUTEN_HANDAKUTEN.includes(nextCharCode)) { // Skip the current character (plain kana) if the next char is a (han)dakuten mark
            nextChar = "";
        } else {
            nextChar = character;
        }

        result += nextChar;
    });

    return result;
};

const x = normalizeDakuten('別件で恐縮ですが');
console.log(x.length);
console.log(x);

(async () => {
    const browser = await puppeteer.launch();
    const newPage = await browser.newPage();

    await newPage.goto("https://cityworks.jp");
    const entries = (await newPage.waitForSelector("#list")) as unknown as HTMLDivElement;

    const rawPhrases: string[] = await newPage.evaluate(val => {
        const matches = val.textContent?.matchAll(/「[^「」]*」/g);

        if(!matches) return [];

        const flattened = Array.from(matches).flat(1);
        const rawPhrases = flattened.map(val => val.slice(1, val.length - 1).trim().replace(/\s+/g, ""));
        
        return rawPhrases;
    }, entries);

    const normalizedPhrases = rawPhrases.map(s => normalizeDakuten(s));
    const noDuplicates = Array.from(new Set(normalizedPhrases));

    console.log(noDuplicates);

    await browser.close();
})();