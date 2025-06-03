import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import path from 'path';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { expect } from 'chai';

describe('UI Test Electron avec Selenium', function () {
  this.timeout(30000); // Maximum time for each test

  let driver: WebDriver;
  let electron: ChildProcessWithoutNullStreams;

  before(async () => {
    // Launch the Electron application
    const electronPath = require('electron'); // no need for type import
    const appDir = path.resolve(__dirname, '..', '..');

    electron = spawn(electronPath, ['.'], {
      cwd: appDir,
      env: {
        ...process.env,
        ELECTRON_ENABLE_LOGGING: 'true',
        ELECTRON_ENABLE_STACK_DUMPING: 'true',
      },
    });

    console.log('[TEST] Electron application started...');

    // Wait to allow the app to start (avoids port errors)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Configure Chrome to connect to Electron
    const options = new chrome.Options();
    options.addArguments('--remote-debugging-port=9222');
    
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  after(async () => {
    if (driver) await driver.quit();
    if (electron) electron.kill();
    console.log('[TEST] Test finished, Electron closed.');
  });

  // it('should display text inside the <body>', async () => {
  //   const body = await driver.wait(until.elementLocated(By.css('body')), 5000);
  //   const text = await body.getText();
  //   console.log('[TEST] Body text:', text);
  //   expect(text).to.be.a('string').and.not.empty;
  // });

  // it('should click on the "Create" button if present', async () => {
  //   const button = await driver.wait(
  //     until.elementLocated(By.xpath("//button[contains(text(), 'Create')]")),
  //     5000
  //   );
  //   expect(await button.isDisplayed()).to.be.true;
  //   await button.click();
  //   console.log('[TEST] "Create" button clicked.');
  // });
});




// it('should display VisualizationTree and right panel when configurations exist', async () => {
//   await setTestState(driver, {
//     configurations: [
//       {
//         name: 'TestConfig1',
//         gridLayoutSelected: true,
//       },
//     ],
//     active: {
//       name: 'TestConfig1',
//       gridLayoutSelected: true,
//     },
//   });

//   const leftPanel = await driver.wait(
//     until.elementLocated(By.css('div[data-testid="visualization-left-panel"]')),
//     5000,
//   );
//   const rightPanel = await driver.wait(
//     until.elementLocated(By.css('div[data-testid="visualization-right-panel"]')),
//     5000,
//   );

//   expect(await leftPanel.isDisplayed()).to.be.true;
//   expect(await rightPanel.isDisplayed()).to.be.true;

//   const leftWidth = await leftPanel.getCssValue('width');
//   const rightWidth = await rightPanel.getCssValue('width');

//   expect(leftWidth).to.include('16.66');
//   expect(rightWidth).to.include('83.33');
// });

// it('should toggle the left panel width when toggle button clicked', async () => {
//   await setTestState(driver, {
//     configurations: [
//       {
//         name: 'TestConfig1',
//         gridLayoutSelected: true,
//       },
//     ],
//     active: {
//       name: 'TestConfig1',
//       gridLayoutSelected: true,
//     },
//   });

//   const toggleButton = await driver.wait(
//     until.elementLocated(By.css('button[data-testid="toggle-visualization-tree"]')),
//     5000,
//   );
//   expect(await toggleButton.isDisplayed()).to.be.true;

//   await toggleButton.click();

//   const leftPanel = await driver.wait(
//     until.elementLocated(By.css('div[data-testid="visualization-left-panel"]')),
//     5000,
//   );
//   const rightPanel = await driver.wait(
//     until.elementLocated(By.css('div[data-testid="visualization-right-panel"]')),
//     5000,
//   );

//   const leftWidthCollapsed = await leftPanel.getCssValue('width');
//   const rightWidthExpanded = await rightPanel.getCssValue('width');

//   expect(leftWidthCollapsed).to.include('3');
//   expect(rightWidthExpanded).to.include('97');

//   await toggleButton.click();

//   const leftWidthExpanded = await leftPanel.getCssValue('width');
//   const rightWidthCollapsed = await rightPanel.getCssValue('width');

//   expect(leftWidthExpanded).to.include('16.66');
//   expect(rightWidthCollapsed).to.include('83.33');
// });

// it('should render VisualizationMetaData if active.gridLayoutSelected is true', async () => {
//   await setTestState(driver, {
//     configurations: [
//       {
//         name: 'TestConfig1',
//         gridLayoutSelected: true,
//       },
//     ],
//     active: {
//       name: 'TestConfig1',
//       gridLayoutSelected: true,
//     },
//   });

//   const metaData = await driver.wait(
//     until.elementLocated(By.css('div[data-testid="visualization-metadata"]')),
//     5000,
//   );
//   expect(await metaData.isDisplayed()).to.be.true;
// });

// it('should render VisualizationPlot if active.gridLayoutSelected is false', async () => {
//   await setTestState(driver, {
//     configurations: [
//       {
//         name: 'TestConfig1',
//         gridLayoutSelected: false,
//       },
//     ],
//     active: {
//       name: 'TestConfig1',
//       gridLayoutSelected: false,
//     },
//   });

//   const plot = await driver.wait(
//     until.elementLocated(By.css('div[data-testid="visualization-plot"]')),
//     5000,
//   );
//   expect(await plot.isDisplayed()).to.be.true;
// });
