

import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import { expect } from 'chai';
import * as chrome from 'selenium-webdriver/chrome';
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import { ConfigurationState } from 'src/renderer/types';

describe('UI Tests for Visualization Component', function () {
  this.timeout(30000);

  let driver: WebDriver;
  let electron: ChildProcessWithoutNullStreams;

  const waitForApi = async () => {
    await driver.wait(async () => {
      const result = await driver.executeScript(
        'return typeof window.api !== "undefined"',
      );
      return result === true;
    }, 10000);
  };

  const setTestState = async (state: Partial<ConfigurationState>) => {
    await driver.executeScript((s: Partial<ConfigurationState>) => {
      // @ts-ignore
      return window.api.setTestState(s);
    }, state);
  };

  before(async () => {
    const electronBinary = require('electron');
    const appDir = path.resolve(__dirname, '..', '..');

    // Lance l'app Electron avec le port 9222 pour le debug Chrome
    electron = spawn(electronBinary, ['.'], {
      cwd: appDir,
      env: {
        ...process.env,
        ELECTRON_ENABLE_LOGGING: 'true',
        ELECTRON_ENABLE_STACK_DUMPING: 'true',
      },
    });


    // Attends 5s que l'app Electron soit bien démarrée
    await new Promise((r) => setTimeout(r, 5000));

    const options = new  Options() // ✅ au lieu de chrome.Options()
      .addArguments('--remote-debugging-port=9222')
      .addArguments('--no-sandbox')
      .addArguments('--disable-dev-shm-usage');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options as chrome.Options) // ✅ utilise le type correct
      // .usingServer('http://localhost:9515') // <-- ne pas mettre ça si tu n’as pas ChromeDriver séparé
      .build();

    // await driver.get('http://localhost:3001'); // URL locale fournie par Webpack dans Forge

    await waitForApi(); // Attends que window.api soit prêt
  });

  after(async () => {
    if (driver) await driver.quit();
    if (electron) electron.kill();
  });

  it('should show "No configurations available" text if configurations is empty', async () => {
    await setTestState({
      configurations: [],
      active: null,
    });

    const noConfigText = await driver.wait(
      until.elementLocated(
        By.xpath("//*[contains(text(), 'No configurations available')]"),
      ),
      10000,
    );

    const isDisplayed = await noConfigText.isDisplayed();
    expect(isDisplayed).to.be.true;
  });
});
