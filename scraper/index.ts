import { run } from "./run";

const results: {maxConcurrency: number, result: Awaited<ReturnType<typeof run>>}[] = [];

(async () => {
    for(let maxConcurrency=1;maxConcurrency<=10;maxConcurrency++) {
        const currentResult = await run({ maxConcurrency, maxNumberPhrases: 100 });

        results.push({
            maxConcurrency,
            result: currentResult
        });

        console.log(results[maxConcurrency-1]);
    };
})();