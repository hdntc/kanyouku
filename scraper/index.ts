import * as puppeteer from "puppeteer";

/**
 * Normalizes a string with combining (han)dakuten so that a combination of "plain kana + combining mark" becomes just 1 character
 * @param unnorm The string with combining dakuten or handakuten
 * @returns The string with the dakuten/handakuten combining character removed
 */
const normalizeDakuten = (unnorm: string) => {
    const DAKUTEN_HANDAKUTEN: [number, number] = [12441, 12442];
    let result = "";
    
    Array.from(unnorm).forEach((character, index) => {
        const currentCharCode = character.charCodeAt(0);
        const nextCharCode = unnorm.charCodeAt(index + 1); // NaN if at end
        let nextChar = "";

        if(DAKUTEN_HANDAKUTEN.includes(currentCharCode)) { // When we find a combining dakuten or handakuten
            const plainCharCode = unnorm.charCodeAt(index-1); // Get character code of kana w/o dakuten
            let newCharCode: number;
            
            if(currentCharCode === 12441) { // If the character has a dakuten
                newCharCode = plainCharCode + 1; // In the hiragana range 0x30F0 - 0x309F in unicode, the dakuten version of a kana comes directly after the plain version
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

const getPhrasesOnPage = async (pageNumber: number, page: puppeteer.Page) => {
    await page.goto(`https://cityworks.jp/?paged=${pageNumber}`);

    const entries = (await page.waitForSelector("#list")) as unknown as HTMLDivElement;

    const rawPhrases: string[] = await page.evaluate(val => { // Run function inside browser context
        const matches = val.textContent?.matchAll(/「[^「」]*」/g); // Find instances of substrings that contain a quote (see the webpage for why this is done)

        if(!matches) return [];

        const flattened = Array.from(matches).flat(1);
        const rawPhrases = flattened.map(val => val.slice(1, val.length - 1).trim().replace(/\s+/g, "")); // Remove quotes (kagi-kakko) and whitespace from string
        
        return rawPhrases;
    }, entries); // Run the above function on the list div

    //Combine combining characters
    //This prevents strings that are seemingly duplicates but differ by whether or not the phrase uses combining characters or precombined characters
    const normalizedPhrases = rawPhrases.map(s => normalizeDakuten(s));
    const noDuplicates = Array.from(new Set(normalizedPhrases));

    return noDuplicates;
};

(async () => {
    const browser = await puppeteer.launch({headless: false});
    const newPage = await browser.newPage();
    let result: string[] = [];
    
    for(let pageNumber=1; pageNumber<=1337; pageNumber++) {
        result = [...result, ...await getPhrasesOnPage(pageNumber, newPage)];
        console.log(`After scraping ${pageNumber} pages:`, result);
    }

    await browser.close();
})();