const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const readline = require('readline');
const { writeFileSync } = require('fs');

function getUserInput(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, answer => {
    rl.close(); resolve(answer);
  })
  );
}

async function run() {
  console.log(`
     ======================================== 
       | ONE LINE P2P SCHEDULE FETCH TOOL | 
     ======================================== 
     `);
  // Setup Chrome options
  const options = new chrome.Options()
    .addArguments('headless');
  // Remove headless mode to display the browser



  // Launch Chrome browser
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  console.log('[INFO] Launching Chrome browser...');

  try {
    while (true) {
      const answerPOL = await getUserInput('Please enter POL (5 letters code): ');
      console.log(`You entered: ${answerPOL}`);
      const answerPOD = await getUserInput('Please enter POD (5 letters code): ');
      console.log(`You entered: ${answerPOD}`);
      // Navigate to the page
      const serviceLink = 'https://ecomm.one-line.com/one-ecom/schedule/point-to-point-schedule'
      console.log(`[INFO] Navigating to: ${serviceLink}`);
      await driver.get(serviceLink);
      //  Wait for the dropdown to appear and select the first item
      const inputBox = await driver.wait(
        until.elementLocated(By.id('origins-input')),
        5000 // Wait up to 5 seconds for the dropdown to appear
      );
      // Step 1: Enter the text "VNSGN" into the input field
      const inputField = await driver.findElement(By.id('origins-input'));

      await inputField.sendKeys(answerPOL);
      console.log('Inputing Origin...');



      await driver.sleep(3000);
      console.log('Selecting Origin...');
      // Function to select an option by its name from a dropdown list
      await driver.wait(until.elementLocated(By.id('origins-item-0')), 10000);
      const originListItem = await driver.findElement(By.id('origins-item-0'));
      const originText = await originListItem.getText();
      console.log(`Text of destinationListItem: ${originText}`);
      await originListItem.click()
      // Usage example: Select the 'HO CHI MINH, VIETNAM (CY)' option in the dropdown


      const inputDField = await driver.findElement(By.id('destinations-input'));
      await inputDField.sendKeys(answerPOD);
      console.log('Inputing Destination...');

      // Hover over the input field
      // Function to select an option by its name from a dropdown list
      await driver.wait(until.elementLocated(By.id('destinations-item-0')), 10000);
      const destinationListItem = await driver.findElement(By.id('destinations-item-0'));
      const destinationText = await destinationListItem.getText();
      console.log(`Text of destinationListItem: ${destinationText}`);
      await destinationListItem.click()


      await driver.sleep(2000);
      console.log('Selecting Destination...');

      // Click show 8 weeks schedule
      const portNextInput = await driver.findElement(By.id("menu:next-week-value:trigger"));
      await portNextInput.click();
      await driver.sleep(5000);
      await driver.wait(until.elementLocated(By.id("next-week-value-56")), 10000);
      const weekInput = await driver.findElement(By.id("next-week-value-56"));
      // await driver.executeScript("arguments[0].click();", weekInput);
      // console.log(weekInput)
      await weekInput.click();


      console.log('Clicking Search Button...');
      const searchButton = await driver.findElement(By.css('button[data-cy="new-schedule-search-btn"]'));
      await searchButton.click();


      await driver.sleep(10000);

      // GETTING SCHEDULES
      const scheduleCards = await driver.wait(
        until.elementsLocated(By.className("ScheduleDetailCard_card__esWyc")),
        10000
      )
      // click show all items
      await driver.wait(until.elementLocated(By.id("menu:new-schedule-routes-per-page:trigger")), 5000)
      const showAllInput = await driver.findElement(By.id("menu:new-schedule-routes-per-page:trigger"));
      await showAllInput.click();
      await driver.wait(until.elementLocated(By.id("new-schedule-routes-per-page-9007199254740991")), 5000);
      const showItemInput = await driver.findElement(By.id("new-schedule-routes-per-page-9007199254740991"));
      await showItemInput.click();

      if (scheduleCards.length > 0) {
        console.log(`found:${scheduleCards.length} schedules`);
        const data = [];
        const headers = ['Departure', 'Arrival', 'Vessel Name', 'Service Land Name', 'POL', 'POD']; // Add headers

        const departureElements = await driver.findElements(By.css('[class="ScheduleItem_date__WLAPW"][data-cy="new-schedule-departure"]'));
        const arrivalElements = await driver.findElements(By.css('[class="ScheduleItem_date__WLAPW"][data-cy="new-schedule-arrival"]'));
        const vesselNameElements = await driver.findElements(By.css('[data-p2p-vessel-voyage-information]'));
        const serviceNameElements = await driver.findElements(By.css('[data-p2p-service-lane]'));
        // console.log(departureElements, vesselNameElements, serviceNameElements)
        // console.log(departureElements[0], vesselNameElements[0], serviceNameElements[0])
        if (departureElements.length === vesselNameElements.length &&
          vesselNameElements.length === serviceNameElements.length &&
          vesselNameElements.length === arrivalElements.length) {
          for (let i = 0; i < departureElements.length; i++) {
            const departure = await departureElements[i].getText();
            const arrival = await arrivalElements[i].getText()
            const vesselName = await vesselNameElements[i].getText();
            const serviceName = await serviceNameElements[i].getText();
            data.push([departure, arrival, vesselName, serviceName, answerPOL, answerPOD]);
          }
        } else { console.error('[ERROR] Mismatch in the number of elements found for each category.'); };
        console.log(data);
        // Generate CSV string 
        const csvString = [headers, ...data].map(row => row.join(',')).join('\n');
        writeFileSync('schedule_data.csv', csvString);
        console.log('[INFO] CSV file created: schedule_data.csv');
        break;
      } else {
        console.log('[INFO] No schedule cards found. Please try again');
      }
    }


  } finally {
    // Close the browser with a slight delay for viewing the results
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await driver.quit();
  }
}

run().catch((error) => {
  console.error('[ERROR]:', error);
});