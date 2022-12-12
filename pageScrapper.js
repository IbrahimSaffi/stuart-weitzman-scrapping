const ObjectsToCsv = require("objects-to-csv");

const scraperObject = {
    async scraper(browser) {
        let page = await browser.newPage();
        console.log(`Navigating to https://ca.stuartweitzman.com/en ...`);
        await page.goto("https://ca.stuartweitzman.com/en");
        let categories = await page.$$('.nav-item')
        let categoriesObj = {}
        let itemsObj = []
        for (let i = 0; i < categories.length; i++) {
            let categoryLink = await categories[i].$('a')
            let link = await (await categoryLink.getProperty("href")).jsonValue()
            let nameOfCategory = await (await categoryLink.getProperty("innerText")).jsonValue()
            categoriesObj[nameOfCategory] = link
        }
        for (let key in categoriesObj) {
           await page.goto(categoriesObj[key]);
            async function autoScroll(page){
                await page.evaluate(async () => {
                    await new Promise((resolve) => {
                        var totalHeight = 0;
                        var distance = 100;
                        var timer = setInterval(() => {
                            var scrollHeight = document.body.scrollHeight;
                            window.scrollBy(0, distance);
                            totalHeight += distance;
            
                            if(totalHeight >= scrollHeight - window.innerHeight){
                                clearInterval(timer);
                                resolve();
                            }
                        }, 50);
                    });
                    
                });
            }
        //    await autoScroll(page)
            let items = await page.$$('.product-tile__upper-section')
            console.log(items)
            categoriesObj[key] = []
            for (let j = 0; j < items.length; j++) {
                let itemLinkTag = await items[j].$('a')
                if(itemLinkTag!==null){
                let itemlink = await (await itemLinkTag.getProperty("href")).jsonValue()
                console.log(itemlink)
                categoriesObj[key].push(itemlink)

                }
                if(categoriesObj[key].length===5){
                    break
                }
            }
            console.log(key,categoriesObj[key].length)
        }
        for (let key in categoriesObj){
            for(let k =0;k<categoriesObj[key].length;k++){
                await page.goto(categoriesObj[key][k]);
                let itemObj ={}
                itemObj.category = key
                let nameTag = await page.$('.product-name')
                let name = await (await nameTag.getProperty("innerText")).jsonValue()
                itemObj.name= name
                let reviewTag = await page.$('.pdp_reviews__score')
                if(reviewTag!==null){
                    let review = await (await reviewTag.getProperty("title")).jsonValue()
                    itemObj.review= review
                }
                let priceTag = await page.$('.sales')
                let price = await (await priceTag.getProperty("innerText")).jsonValue()
                price = price.replace(/\s/g, '')
                itemObj.price= price
                let features = await page.$$('.js-attr-box .row')
                for(let l=0;l<features.length;l++){
                    let featureTag = await features[l].$('.attr-label')
                    if(featureTag!==null){
                        let featuresLabel = await (await featureTag.getProperty("innerText")).jsonValue()
                        let label = featuresLabel.split(":")[0].toLowerCase()
                        itemObj[label] = "No Data Added"
                        if(featuresLabel.includes("COLOR")){
                            itemObj[label] = []
                            let imgs = await page.$$(".select-color img")
                            for(let img =0 ;img<imgs.length;img++){
                                itemObj[label].push((await (await imgs[img].getProperty("title")).jsonValue()))
                            }
                        }
                    }
                    
                }

              itemsObj.push(itemObj)
            }
        }
          (async () => {
            const csv = new ObjectsToCsv(itemsObj);
           
            await csv.toDisk('./items.csv');
           
            console.log(await csv.toString());
          })();
        console.log(itemsObj)
        browser.close()
    }
}
module.exports = scraperObject;