import { Cluster } from "puppeteer-cluster";
import { getPhrasesOnPage } from "./getPhrasesOnPage";

type RunOptions = {
    maxConcurrency: number,
    maxNumberPhrases?: number
};

type TaskData = {
    pageNumber: number,
    nextPageNumber: number
};

export const run = async ({ maxConcurrency, maxNumberPhrases }: RunOptions) => {
    const cluster: Cluster<TaskData, void> = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency,
        puppeteerOptions: {
            headless: false
        }
    });

    let result: String[] = [];
    let phrasesAtTime: {time: number, numberOfPhrases: number}[] = []; // time: seconds since start
    let startTime: Date = new Date();
    let isStopped: boolean = false;

    cluster.on("taskerror", (err, data, willRetry) => {
        console.error(err);
        console.log("error occured with data:",data);
    })

    await cluster.task(async ({page, data: {pageNumber, nextPageNumber}}) => {
        const phrases = await getPhrasesOnPage(pageNumber, page);
        if(maxNumberPhrases && result.length + phrases.length > maxNumberPhrases) {
            isStopped = true;
        } else {
            result = [...result, ...phrases];
            phrasesAtTime.push({ 
                time: 0.001 * ((new Date()).getTime() - startTime.getTime()), 
                numberOfPhrases: result.length 
            });

            if(!isStopped) {
                cluster.queue({
                    pageNumber: nextPageNumber, 
                    nextPageNumber: nextPageNumber+maxConcurrency
                });
            }
        }
    });

    for(let i=1;i<=maxConcurrency;i++) {
        cluster.queue({
            pageNumber: i,
            nextPageNumber: i+maxConcurrency
        });
    }
        

    await cluster.idle();
    await cluster.close();

    return {
        phrases: result,
        phrasesAtTime: phrasesAtTime
    };
};