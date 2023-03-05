import { run } from "./run";

type FindOptimalOptions = {
    smallestMaxConcurrency?: number,
    largestMaxConcurrency?: number,
    numberOfPhrases?: number
};

/**
 * Finds the optimal concurrency to scrape the site.
 * Attempts to maximize number of phrases found per second.
 */
export const findOptimal = async ({ smallestMaxConcurrency, largestMaxConcurrency, numberOfPhrases }: FindOptimalOptions) => {
    smallestMaxConcurrency ??= 1;
    largestMaxConcurrency ??= 10;
    numberOfPhrases ??= 100;

    const results: {maxConcurrency: number, result: Awaited<ReturnType<typeof run>>}[] = [];

    for(let maxConcurrency=smallestMaxConcurrency;maxConcurrency<=largestMaxConcurrency;maxConcurrency++) {
        const currentResult = await run({ maxConcurrency, maxNumberPhrases: numberOfPhrases });

        results.push({
            maxConcurrency,
            result: currentResult
        });
    };

    const gradients: { [maxConcurrency: number]: number} = {};
    results.forEach(({maxConcurrency, result}) => {
        const times = result.phrasesAtTime;
        let finalPoint: (typeof times)[number] = { time: 0, numberOfPhrases: -1 }; // type of an element of times
        
        times.forEach((currentPoint) => {
            if(currentPoint.numberOfPhrases > finalPoint.numberOfPhrases) {
                finalPoint = {...currentPoint};
            };
        });

        const gradient = finalPoint.numberOfPhrases / finalPoint.time; // number of phrases per second

        gradients[maxConcurrency] = gradient;
    });

    let optimalConcurrency: number = 0;
    let currentOptimalGradient: number = -1;
    Object.keys(gradients).forEach((maxConcurrency) => {
        let parsed = parseInt(maxConcurrency);
        if(gradients[parsed] > currentOptimalGradient) {
            optimalConcurrency = parsed;
            currentOptimalGradient = gradients[parsed];
        }
    });

    return optimalConcurrency;
};