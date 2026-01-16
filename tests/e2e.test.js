const { Builder, By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:3000';

describe('KurirPay End-to-End Quality Assurance', function () {
    this.timeout(30000); // 30 seconds timeout
    let driver;

    before(async function () {
        driver = await new Builder().forBrowser('chrome').build();
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    it('1. Should load Login Page correctly', async function () {
        await driver.get(FRONTEND_URL);
        const title = await driver.getTitle();
        expect(title).to.include('KurirPay'); // SettingsContext sets title

        const loginHeader = await driver.findElement(By.tagName('h2')).getText();
        expect(loginHeader).to.equal('Masuk ke Akun');
    });

    it('2. Should fail login with wrong credentials', async function () {
        await driver.get(FRONTEND_URL);

        // Find inputs
        const inputs = await driver.findElements(By.css('input'));
        const emailInput = inputs[0];
        const passInput = inputs[1];

        // Type wrong creds
        await emailInput.sendKeys('wrong@user.com');
        await passInput.sendKeys('wrongpassword');

        // Click login
        const button = await driver.findElement(By.css('button[type="submit"]'));
        await button.click();

        // Wait for error
        try {
            const errorMsg = await driver.wait(until.elementLocated(By.css('.text-red-700')), 5000);
            const text = await errorMsg.getText();
            expect(text).to.contain('Invalid credentials');
        } catch (e) {
            throw new Error('Error message not found or login did not fail as expected');
        }
    });

    it('3. Should register, login and see Dashboard', async function () {
        const rand = Math.floor(Math.random() * 1000);
        const testEmail = `qa_kurir_${rand}@test.com`;

        // Go to Register
        await driver.get(FRONTEND_URL + '/#/login'); // Ensure we are at login
        const toggleBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Belum punya akun')]"));
        await toggleBtn.click();

        // Fill Register Form
        const inputs = await driver.findElements(By.css('input'));
        await inputs[0].sendKeys('QA Automation User'); // Name
        await inputs[1].sendKeys(testEmail); // Email
        await inputs[2].sendKeys('password123'); // Password

        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await submitBtn.click();

        // Handle Alert
        try {
            await driver.wait(until.alertIsPresent(), 5000);
            const alert = await driver.switchTo().alert();
            expect(await alert.getText()).to.contain('Registrasi berhasil');
            await alert.accept();
        } catch (e) {
            // Sometimes alert might be missed if too fast, but we check if we are back to login mode
        }

        // Now Login
        // Re-find inputs because DOM changed
        const loginInputs = await driver.findElements(By.css('input'));
        await loginInputs[0].clear();
        await loginInputs[0].sendKeys(testEmail);
        await loginInputs[1].clear();
        await loginInputs[1].sendKeys('password123');

        const loginBtn = await driver.findElement(By.css('button[type="submit"]'));
        await loginBtn.click();

        // Wait for Dashboard
        await driver.wait(until.urlContains('/#/'), 10000);

        const welcomeMsg = await driver.wait(until.elementLocated(By.tagName('h1')), 5000);
        expect(await welcomeMsg.getText()).to.include('Halo, QA');
    });

    it('4. Should Logout successfully', async function () {
        const logoutBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Keluar')]"));
        await logoutBtn.click();

        await driver.wait(until.elementLocated(By.tagName('h2')), 5000);
        const loginHeader = await driver.findElement(By.tagName('h2')).getText();
        expect(loginHeader).to.equal('Masuk ke Akun');
    });
});
