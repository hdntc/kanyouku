/**
 * Normalizes a string with combining (han)dakuten so that a combination of "plain kana + combining mark" becomes just 1 character
 * @param unnorm The string with combining dakuten or handakuten
 * @returns The string with the dakuten/handakuten combining character removed
 */
export const normalizeDakuten = (unnorm: string) => {
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