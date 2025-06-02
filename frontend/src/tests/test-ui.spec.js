const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const { spawn } = require('child_process');
const { expect } = require('chai');

describe('UI Test Electron avec Selenium', function () {
  this.timeout(30000); // Temps max pour chaque test

  let driver;
  let electron;

  before(async () => {
    // Lancer l'application Electron
    const electronPath = require('electron');
    const appDir = path.resolve(__dirname, '..', '..');

    electron = spawn(electronPath, ['.'], {
      cwd: appDir,
      env: {
        ...process.env,
        ELECTRON_ENABLE_LOGGING: true,
        ELECTRON_ENABLE_STACK_DUMPING: true,
      },
    });

    console.log('[TEST] Application Electron lancée...');

    // Attendre un peu que l'app se lance (sinon port 9222 pas encore dispo)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Configurer Selenium pour se connecter à Electron (Chrome en mode debug)
    const options = new chrome.Options();
    options.options_.debuggerAddress = 'localhost:9222';

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  after(async () => {
    if (driver) await driver.quit();
    if (electron) electron.kill();
    console.log('[TEST] Test terminé, Electron fermé.');
  });

  it('doit afficher du texte dans le <body>', async () => {
    const body = await driver.wait(until.elementLocated(By.css('body')), 5000);
    const text = await body.getText();
    console.log('[TEST] Texte du body:', text);
    expect(text).to.be.a('string').and.not.empty;
  });

  it('doit cliquer sur le bouton "Créer" s’il est présent', async () => {
    const bouton = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(text(), 'Créer')]")),
      5000
    );
    expect(await bouton.isDisplayed()).to.be.true;
    await bouton.click();
    console.log('[TEST] Bouton "Créer" cliqué.');
  });
});
