import * as puppeteer from "puppeteer";
import { Cluster } from "puppeteer-cluster";
import { normalizeDakuten } from "./normalizeDakuten";

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
    const cluster: Cluster<number, void> = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 5,
        puppeteerOptions: {
            headless: false
        }
        
    });
    let result: String[] = [];
    let phrasesAtTime: {time: number, numberOfPhrases: number}[] = []; // time: seconds since start
    let startTime: Date = new Date();

    cluster.on("taskerror", (err, data, willRetry) => {
        console.error(err);
        console.log("error occured with data:",data);
    })

    await cluster.task(async ({page, data: pageNumber}) => {
        const phrases = await getPhrasesOnPage(pageNumber, page);
        result = [...result, ...phrases];
        phrasesAtTime.push({ 
            time: 0.001 * ((new Date()).getTime() - startTime.getTime()), 
            numberOfPhrases: phrases.length 
        });
    });

    for(let i=0;i<=1337;i++) {
        cluster.queue(i);
    };

    await cluster.idle();
    await cluster.close();


})();