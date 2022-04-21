import React, { Suspense, useEffect, useState } from 'react'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { Route, Switch } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { AppState } from 'state'
import styled from 'styled-components'
import { useWeb3React } from '@web3-react/core'
import useWordpressInfo from 'hooks/useWordpressInfo'
import useDomainInfo from 'hooks/useDomainInfo'
import useStorageInfo from 'hooks/useStorageInfo'
import { useAppState } from 'state/application/hooks'
import { retrieveDomainData, updateAppData } from 'state/application/actions'
import Loader from 'components/Loader'
import Panel from './Panel'
import Connection from './Connection'
import Header from 'components/Header'
import Popups from 'components/Popups'
import GreetingScreen from 'components/GreetingScreen'
import Web3ReactManager from 'components/Web3ReactManager'
import DarkModeQueryParamReader from 'theme/DarkModeQueryParamReader'
import AddLiquidity from './AddLiquidity'
import {
  RedirectDuplicateTokenIds,
  RedirectOldAddLiquidityPathStructure,
  RedirectToAddLiquidity,
} from './AddLiquidity/redirects'
import Pool from './Pool'
import Pools from './Pools'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
import { RedirectOldRemoveLiquidityPathStructure } from './RemoveLiquidity/redirects'
import Swap from './Swap'
import Footer from 'components/Footer'
import { OpenClaimAddressModalAndRedirectToSwap, RedirectPathToSwapOnly } from './Swap/redirects'
import networks from 'networks.json'

const LoaderWrapper = styled.div`
  position: absolute;
  z-index: 4;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.bg1};
`

const AppWrapper = styled.div<{ background?: string }>`
  min-height: 100vh;
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: space-between;
  overflow-x: hidden;
  ${({ background }) =>
    background
      ? `
      background-size: cover;
      background-position:center;
      background-image: url(${background});
    `
      : ''}
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
`

const BodyWrapper = styled.div`
  width: 100%;
  padding: 3rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 1;
`

const FooterWrapper = styled.footer`
  width: 100%;
  padding: 1rem 5%;
`

export default function App() {
  const dispatch = useDispatch()
  const { active, chainId } = useWeb3React()
  const wordpressData = useWordpressInfo()

  const [domainDataTrigger, setDomainDataTrigger] = useState<boolean>(false)

  useEffect(() => {
    setDomainDataTrigger((state) => !state)
  }, [chainId])

  const [isAvailableNetwork, setIsAvailableNetwork] = useState(true)
  const [greetingScreenActive, setGreetingScreenActive] = useState(false)

  useEffect(() => {
    const greetingScreenLoaclStorageValue = localStorage.getItem('greetingScreenActive')
    setGreetingScreenActive(Boolean(greetingScreenLoaclStorageValue))
  }, [greetingScreenActive])

  useEffect(() => {
    //@ts-ignore
    if (chainId && networks[chainId]) {
      //@ts-ignore
      const { registry, multicall, wrappedToken } = networks[chainId]

      const contractsAreFine = registry && multicall && wrappedToken?.address
      const networkIsFine =
        chainId && wordpressData?.wpNetworkIds?.length ? wordpressData.wpNetworkIds.includes(chainId) : true

      setIsAvailableNetwork(Boolean(contractsAreFine && networkIsFine))
    }
  }, [chainId, domainDataTrigger, wordpressData])

  const { data: domainData, isLoading: domainLoading } = useDomainInfo(domainDataTrigger)
  const { data: storageData, isLoading: storageLoading } = useStorageInfo()

  useEffect(() => {
    if (domainData) {
      dispatch(retrieveDomainData(domainData))
    }
  }, [domainData, domainLoading, dispatch])

  useEffect(() => {
    dispatch(updateAppData(storageData ? { ...storageData } : storageData))
  }, [storageData, storageLoading, dispatch])

  const { admin, factory, router, projectName, background } = useAppState()

  const [appIsReady, setAppIsReady] = useState(false)

  useEffect(() => {
    setAppIsReady(Boolean(active && admin && factory && router))
  }, [chainId, active, admin, factory, router])

  const appManagement = useSelector<AppState, AppState['application']['appManagement']>(
    (state) => state.application.appManagement
  )

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(domainLoading || storageLoading)
  }, [domainLoading, storageLoading])

  const domain = window.location.hostname || document.location.host
  const DOMAIN_TITLES: { [domain: string]: string } = {
    'internethedgefund.com': 'IHF Swap',
  }

  return (
    <Suspense fallback={null}>
      <HelmetProvider>
        <Helmet>
          <title>{!!DOMAIN_TITLES[domain] ? DOMAIN_TITLES[domain] : projectName || document.title}</title>
        </Helmet>

        <Route component={DarkModeQueryParamReader} />
        <Web3ReactManager>
          <Popups />

          {loading ? (
            <LoaderWrapper>
              <Loader size="2.8rem" />
            </LoaderWrapper>
          ) : appIsReady && isAvailableNetwork ? (
            <>
              {appManagement ? (
                <BodyWrapper>
                  <Panel setDomainDataTrigger={setDomainDataTrigger} />
                </BodyWrapper>
              ) : (
                <AppWrapper background={background}>
                  {/* addition tag for the flex layout */}
                  <div>
                    <HeaderWrapper>
                      <Header />
                    </HeaderWrapper>

                    <BodyWrapper>
                      <Switch>
                        <Route exact strict path="/swap" component={Swap} />
                        <Route exact strict path="/claim" component={OpenClaimAddressModalAndRedirectToSwap} />
                        <Route exact strict path="/find" component={PoolFinder} />
                        <Route exact strict path="/pool" component={Pool} />
                        <Route exact strict path="/pools" component={Pools} />
                        <Route exact strict path="/create" component={RedirectToAddLiquidity} />
                        <Route exact path="/add" component={AddLiquidity} />
                        <Route exact path="/add/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
                        <Route exact path="/add/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
                        <Route exact path="/create" component={AddLiquidity} />
                        <Route exact path="/create/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
                        <Route exact path="/create/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
                        <Route
                          exact
                          strict
                          path="/remove/:tokens"
                          component={RedirectOldRemoveLiquidityPathStructure}
                        />
                        <Route exact strict path="/remove/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />
                        <Route component={RedirectPathToSwapOnly} />
                      </Switch>
                    </BodyWrapper>
                  </div>

                  <FooterWrapper>
                    <Footer />
                  </FooterWrapper>
                </AppWrapper>
              )}
            </>
          ) : (
            <>
              {!greetingScreenActive ? (
                <GreetingScreen setGreetingScreenActive={setGreetingScreenActive} />
              ) : (
                <Connection
                  setDomainDataTrigger={setDomainDataTrigger}
                  domainData={domainData}
                  isAvailableNetwork={isAvailableNetwork}
                />
              )}
            </>
          )}
        </Web3ReactManager>
      </HelmetProvider>
    </Suspense>
  )
}
