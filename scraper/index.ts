import { run } from "./run";

const results: {maxConcurrency: number, result: Awaited<ReturnType<typeof run>>}[] = [];

(async () => {
    for(let maxConcurrency=5;maxConcurrency<=20;maxConcurrency++) {
        const currentResult = await run({ maxConcurrency, maxNumberPhrases: 1000 });

        results.push({
            maxConcurrency,
            result: currentResult
        });

        console.log(results[maxConcurrency-1]);
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

    console.log("Optimal concurrency is",optimalConcurrency);
    console.log(gradients);
})();