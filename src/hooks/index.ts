import { Web3Provider } from '@ethersproject/providers'
import { useWeb3React as useWeb3ReactCore } from '@web3-react/core'
import { Web3ReactContextInterface } from '@web3-react/core/dist/types'
import { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { injected } from '../connectors'
import { NetworkContextName } from '../constants'
import { waitForBridgeReady } from '../utils/walletBridge'

export function useActiveWeb3React(): Web3ReactContextInterface<Web3Provider> & { chainId?: number } {
  const context = useWeb3ReactCore<Web3Provider>()
  const contextNetwork = useWeb3ReactCore<Web3Provider>(NetworkContextName)
  return context.active ? context : contextNetwork
}

/**
 * Standard eager connect flow: check isAuthorized, connect if previously authorized.
 * Extracted to avoid duplication between bridge fallback and standalone paths.
 */
function standardEagerConnect(
  activate: (connector: any, onError?: any, throwErrors?: boolean) => Promise<void>,
  setTried: (value: boolean) => void
) {
  injected.isAuthorized().then((isAuthorized) => {
    if (isAuthorized) {
      activate(injected, undefined, true).catch(() => {
        setTried(true)
      })
    } else {
      if (isMobile && window.ethereum) {
        activate(injected, undefined, true).catch(() => {
          setTried(true)
        })
      } else {
        setTried(true)
      }
    }
  })
}

const BRIDGE_READY_TIMEOUT = 5000

export function useEagerConnect() {
  const { activate, active } = useWeb3ReactCore() // specifically using useWeb3ReactCore because of what this hook does
  const [tried, setTried] = useState(false)

  useEffect(() => {
    const isBridgeMode = !!(window as any).ethereum?.isSwapWalletAppsBridge

    if (isBridgeMode) {
      // Bridge mode: wait for bridge handshake, then activate immediately
      waitForBridgeReady(BRIDGE_READY_TIMEOUT)
        .then(() => {
          activate(injected, undefined, true).catch(() => {
            setTried(true)
          })
        })
        .catch((err) => {
          // Bridge timeout or error — fall back to standard eager connect
          console.warn('Bridge ready timeout, falling back to standard connect:', err.message)
          standardEagerConnect(activate, setTried)
        })
    } else {
      // Standalone mode: standard eager connect flow
      standardEagerConnect(activate, setTried)
    }
  }, [activate]) // intentionally only running on mount (make sure it's only mounted once :))

  // if the connection worked, wait until we get confirmation of that to flip the flag
  useEffect(() => {
    if (active) {
      setTried(true)
    }
  }, [active])

  return tried
}

/**
 * Use for network and injected - logs user in
 * and out after checking what network theyre on
 */
export function useInactiveListener(suppress = false) {
  const { active, error, activate, deactivate } = useWeb3ReactCore() // specifically using useWeb3React because of what this hook does

  useEffect(() => {
    const { ethereum } = window

    if (ethereum && ethereum.on && !active && !error && !suppress) {
      const handleChainChanged = (chainId: string) => {
        const supported = injected.supportedChainIds?.includes(Number(chainId))

        if (!supported) return deactivate()

        // eat errors
        activate(injected, undefined, true).catch((error) => {
          console.error('Failed to activate after chain changed', error)
        })
      }

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          // eat errors
          activate(injected, undefined, true).catch((error) => {
            console.error('Failed to activate after accounts changed', error)
          })
        }
      }

      ethereum.on('chainChanged', handleChainChanged)
      ethereum.on('accountsChanged', handleAccountsChanged)

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('chainChanged', handleChainChanged)
          ethereum.removeListener('accountsChanged', handleAccountsChanged)
        }
      }
    }
    return undefined
  }, [active, error, suppress, activate, deactivate])
}
