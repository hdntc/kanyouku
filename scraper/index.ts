import * as puppeteer from "puppeteer";

(async () => {
    const browser = await puppeteer.launch();
    const newPage = await browser.newPage();

    await newPage.goto("https://cityworks.jp");
    await newPage.screenshot({ path: "./screenshots/homepage.png" });

    await browser.close();
})();