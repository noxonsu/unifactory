import React, { Suspense, useEffect, useState } from 'react'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { Route, Switch } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { AppState } from 'state'
import styled from 'styled-components'
import { useWeb3React } from '@web3-react/core'
import useWordpressInfo from 'hooks/useWordpressInfo'
import useDomainInfo from 'hooks/useDomainInfo'
import { useAppState } from 'state/application/hooks'
import { retrieveDomainData } from 'state/application/actions'
import Loader from 'components/Loader'
import Panel from './Panel'
import Connection from './Connection'
import Header from 'components/Header'
import Popups from 'components/Popups'
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

const AppWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: space-between;
  overflow-x: hidden;
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

  const { data: domainData, isLoading } = useDomainInfo(domainDataTrigger)

  useEffect(() => {
    //@ts-ignore
    dispatch(retrieveDomainData(domainData ? { ...domainData } : domainData))
  }, [domainData, isLoading, dispatch])

  const { admin, factory, router, projectName } = useAppState()

  const [appIsReady, setAppIsReady] = useState(false)

  useEffect(() => {
    setAppIsReady(Boolean(active && admin && factory && router))
  }, [chainId, active, admin, factory, router])

  const appManagement = useSelector<AppState, AppState['application']['appManagement']>(
    (state) => state.application.appManagement
  )

  return (
    <Suspense fallback={null}>
      <HelmetProvider>
        {projectName && (
          <Helmet>
            <title>{projectName}</title>
          </Helmet>
        )}

        <Route component={DarkModeQueryParamReader} />
        <Web3ReactManager>
          <Popups />

          {isLoading ? (
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
                <AppWrapper>
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
            <Connection
              setDomainDataTrigger={setDomainDataTrigger}
              domainData={domainData}
              isAvailableNetwork={isAvailableNetwork}
            />
          )}
        </Web3ReactManager>
      </HelmetProvider>
    </Suspense>
  )
}
