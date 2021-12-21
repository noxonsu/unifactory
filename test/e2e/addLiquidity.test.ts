import puppeteer from 'puppeteer'
import * as dappeteer from '@chainsafe/dappeteer'
import {
  clickOn,
  takeScreenshot,
  MINUTE,
  TEN_SECONDS,
  THIRTY_SECONDS,
  timeOut,
  SECOND,
  importCustomToken,
} from '../utils'

const localApp = 'http://localhost:3000/'

// Rinkeby
const tokenA = {
  // DAI
  address: '0xc7ad46e0b8a400bb3c915120d284aafba8fc4735',
  amount: 1,
}
const tokenB = {
  // USDT
  address: '0xaf3c38a810670786d2fbd1a40adea7f9dc6e8746',
  amount: 1,
}

jest.setTimeout(MINUTE * 2.5)

const metamaskConfig = {
  seed: process.env.METAMASK_SEED,
  // password: 'password1234',
}

describe('Add liquidity', () => {
  const startupDelay = TEN_SECONDS * 3
  let browser: undefined | puppeteer.Browser
  let page: undefined | puppeteer.Page
  let metamask: any

  const falseTest = () => expect(false).toBe(true)

  const failTest = async (error, part) => {
    await takeScreenshot(page, part)
    console.error(error)
    falseTest()
  }

  beforeAll(async () => {
    browser = await dappeteer.launch(puppeteer, { metamaskVersion: dappeteer.RECOMMENDED_METAMASK_VERSION })
    metamask = await dappeteer.setupMetamask(
      browser
      // metamaskConfig
    )
    page = await browser.newPage()

    await metamask.switchNetwork('rinkeby')
    await page.goto(localApp)
  }, startupDelay)

  afterAll(async () => {
    if (page) await page.close()
    if (browser) await browser.close()
  })

  it('Connect Metamask', async () => {
    if (browser && page) {
      try {
        await clickOn({
          page,
          selector: '#connect-wallet',
        })
        await timeOut(SECOND * 5)
        await clickOn({
          page,
          selector: '#connect-METAMASK',
        })
        await timeOut(SECOND)
        await metamask.approve()
        await timeOut(TEN_SECONDS)
      } catch (error) {
        await failTest(error, 'connectWallet')
      }
    } else {
      throw new Error('No the browser or the page')
    }
  })

  it('Import tokens', async () => {
    if (browser && page) {
      try {
        await importCustomToken(page, tokenA.address)
        await importCustomToken(page, tokenB.address)
      } catch (error) {
        await failTest(error, 'tokenImport')
      }
    } else {
      throw new Error('No the browser or the page')
    }
  })

  it('Fill liquidity form', async () => {
    if (browser && page) {
      try {
        await page.goto(`${page.url()}add/`)
        await timeOut(SECOND)

        const [selectOfTokenA, selectOfTokenB] = await page.$$('#open-currency-select-button')

        // TODO: almost the same code ============================
        await selectOfTokenA.click()
        await clickOn({
          page,
          selector: `#token-item-${tokenA.address}`,
        })
        const liquidityInputA = await page.$('#add-liquidity-input-tokena')
        await liquidityInputA.type(String(tokenA.amount))
        // ---------------
        await selectOfTokenB.click()
        await clickOn({
          page,
          selector: `#token-item-${tokenB.address}`,
        })
        const liquidityInputB = await page.$('#add-liquidity-input-tokenb')
        await liquidityInputB.type(String(tokenB.amount))
        // ========================================================
      } catch (error) {
        await failTest(error, 'liquidityForm')
      }

      try {
        // approve and add liquidity
        // await metamask.confirmTransaction()
        // expect().toBe()
      } catch (error) {
        await failTest(error, 'addLiquidity')
      }
    } else {
      throw new Error('No the browser or the page')
    }
  })
})
