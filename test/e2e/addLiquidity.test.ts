import puppeteer from 'puppeteer'
import {
  createMetamaskBrowser,
  clickOn,
  takeScreenshot,
  MINUTE,
  TEN_SECONDS,
  THIRTY_SECONDS,
  timeOut,
  SECOND,
  importCustomToken,
  fillFormInputs,
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

jest.setTimeout(MINUTE * 3)

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
    const { browser: _browser, page: _page, metamask: _metamask } = await createMetamaskBrowser()

    browser = _browser
    page = _page
    metamask = _metamask

    await metamask.switchNetwork('rinkeby')
    await page.goto(localApp)
  }, startupDelay)

  afterAll(async () => {
    if (page) await page.close()
    if (browser) await browser.close()
  })

  it('should connect to Metamask', async () => {
    if (browser && page) {
      try {
        await clickOn({
          page,
          selector: '#connect-wallet',
        })
        await timeOut(SECOND * 3)
        await clickOn({
          page,
          selector: '#connect-METAMASK',
        })
        await timeOut(SECOND)
        await metamask.approve()
        await timeOut(SECOND * 3)
      } catch (error) {
        await failTest(error, 'connectWallet')
      }
    } else {
      throw new Error('No the browser or the page')
    }
  })

  it('should import tokens', async () => {
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

  it('should fill liquidity form', async () => {
    if (browser && page) {
      try {
        await clickOn({
          page,
          selector: `#header-pool-nav-link`,
        })
        await clickOn({
          page,
          selector: `#join-pool-button`,
        })

        await fillFormInputs({
          page,
          tokenA: tokenA.address,
          amountA: tokenA.amount,
          tokenB: tokenB.address,
          amountB: tokenB.amount,
        })
      } catch (error) {
        await failTest(error, 'liquidityForm')
      }
    } else {
      throw new Error('No the browser or the page')
    }
  })

  // it('should add liquidity', async () => {
  //   if (browser && page) {
  //     try {
  //       // approve and add liquidity
  //       // await metamask.confirmTransaction()
  //       // expect().toBe()
  //     } catch (error) {
  //       await failTest(error, 'addLiquidity')
  //     }
  //   } else {
  //     throw new Error('No the browser or the page')
  //   }
  // })
})
