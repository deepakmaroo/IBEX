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

  it('should display text inside the <body>', async () => {
    const body = await driver.wait(until.elementLocated(By.css('body')), 5000);
    const text = await body.getText();
    console.log('[TEST] Body text:', text);
    expect(text).to.be.a('string').and.not.empty;
  });

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
