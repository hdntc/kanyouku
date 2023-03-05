import { Page } from "puppeteer";
import { normalizeDakuten } from "./normalizeDakuten";

export const getPhrasesOnPage = async (pageNumber: number, page: Page) => {
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