import { findOptimal } from './findOptimal';
import { run } from "./run";

(async () => {
    run({
        maxConcurrency: 10,
        maxNumberPhrases: 1000000
    });
})();