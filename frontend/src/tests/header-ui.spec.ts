import { expect } from 'chai';
import { By, until, WebDriver } from 'selenium-webdriver';
import { ConfigurationState } from 'src/renderer/types';
import { mockConfigurationState, mockemptyConfigurationsState } from './utils';
import {
  startApp,
  getDriver,
  stopApp,
  waitForApi,
  setTestState,
  getTestState,
} from './setup';

/**
 * UI Test Suite for the Visualization Component
 */
describe('UI Tests for Visualization Component', function () {
  this.timeout(30000);
  let driver: WebDriver;

  before(async () => {
    await startApp();
    driver = getDriver();
    await waitForApi();
  });

  after(async () => {
    await stopApp();
  });

  afterEach(async () => {
    await setTestState({ configurations: [], active: null });

    // Ferme les modales restantes si besoin
    try {
      const modalOverlay = await driver.findElement(
        By.css('.mantine-Modal-overlay'),
      );
      const isDisplayed = await modalOverlay.isDisplayed();
      if (isDisplayed) {
        const closeButton = await driver.findElement(
          By.css('[data-testid="modal-close-button"]'),
        );
        await closeButton.click();

        // Attends la disparition de l'overlay
        await driver.wait(until.stalenessOf(modalOverlay), 3000);
      }
    } catch (e) {
      // Ignore si la modale n'existe pas
    }
  });

  it('Should create new configuration from header', async () => {
    const newConfigButton = await driver.wait(
      until.elementLocated(By.css('[data-testid="header-add-configuration"]')),
      10000,
    );
    await newConfigButton.click();

    const configCreateModal = await driver.wait(
      until.elementLocated(By.css('[data-testid="config-create-modal"]')),
      10000,
    );
    expect(await configCreateModal.isDisplayed()).to.be.true;

    const input = await driver.wait(
      until.elementLocated(By.css('[data-testid="config-create-name-input"]')),
      10000,
    );
    await input.sendKeys('My New Config');

    const createButton = await driver.wait(
      until.elementLocated(
        By.css('[data-testid="config-create-submit-button"]'),
      ),
      10000,
    );
    await createButton.click();

    const state = await getTestState();
    const names = state.configurations.map((c) => c.name);
    expect(names).to.include('My New Config');
  });

  it('Should delete configuration from header', async () => {
    await setTestState(mockConfigurationState);

    const deleteButton = await driver.wait(
      until.elementLocated(
        By.css('[data-testid="header-delete-configuration"]'),
      ),
      10000,
    );
    await deleteButton.click();

    const confirmationModal = await driver.wait(
      until.elementIsVisible(
        await driver.wait(
          until.elementLocated(By.css('[data-testid="confirm-modal"]')),
          10000,
        ),
      ),
      10000,
    );
    expect(await confirmationModal.isDisplayed()).to.be.true;

    const confirmationTextElement = await driver.wait(
      until.elementLocated(
        By.css('[data-testid="config-delete-confirmation-text"]'),
      ),
      10000,
    );
    const confirmationText = await confirmationTextElement.getText();
    expect(confirmationText).to.equal(
      'Are you sure you want to delete the configuration?',
    );

    const confirmButton = await driver.wait(
      until.elementLocated(By.css('[data-testid="confirm-modal-confirm-button"]')),
      10000,
    );
    await confirmButton.click(); 

    const state = await getTestState();

    //The mockConfigurationState has 2 configurations, so after deletion, there should be 1 left
    expect(state.configurations.length).to.equal(1);

  });
});
