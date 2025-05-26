const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const { spawn } = require('child_process');

// 1. Lancer l'application Electron
const electronPath = require('electron'); // va utiliser le binaire local d'Electron
const appDir = path.resolve(__dirname, '..', '..'); // racine du projet

const electron = spawn(electronPath, ['.'], {
  cwd: appDir,
  env: {
    ...process.env,
    ELECTRON_ENABLE_LOGGING: true,
    ELECTRON_ENABLE_STACK_DUMPING: true,
  },
});

console.log('[TEST] Application Electron lancée.');

(async () => {
  // 2. Connecter Selenium au port de debug 9222
  const options = new chrome.Options();
  options.options_.debuggerAddress = 'localhost:9222';

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    console.log('[TEST] Connexion à Electron via ChromeDriver...');

    // 3. Attendre le chargement de la page
    await driver.sleep(3000); // ajuste si besoin

    // 4. Exemple : récupérer le texte du body
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    console.log('[TEST] Texte dans le <body> :', text);

    // 5. Exemple : cliquer sur un bouton
    // (à condition que ce bouton existe dans ton app)
    const bouton = await driver.findElement(By.xpath("//button[contains(text(), 'Créer')]"));
    await bouton.click();
    console.log('[TEST] Clic sur le bouton "Créer" effectué.');

    await driver.sleep(1000); // attendre réaction UI

  } catch (error) {
    console.error('[TEST] Erreur dans le test :', error);
  } finally {
    await driver.quit();
    electron.kill();
    console.log('[TEST] Test terminé, Electron fermé.');
  }
})();
