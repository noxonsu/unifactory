import React from 'react'
import { render, act, cleanup } from '@testing-library/react'

// Mock modules before importing the component
const mockActivate = jest.fn().mockResolvedValue(undefined)
const mockUseWeb3React = jest.fn()

jest.mock('@web3-react/core', () => ({
  useWeb3React: (...args: any[]) => mockUseWeb3React(...args),
}))

jest.mock('../../connectors', () => ({
  network: {},
}))

jest.mock('../../hooks', () => ({
  useEagerConnect: jest.fn().mockReturnValue(true),
  useInactiveListener: jest.fn(),
}))

jest.mock('../../constants', () => ({
  NetworkContextName: 'NETWORK',
}))

jest.mock('../Loader', () => () => <div>Loading...</div>)

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('styled-components', () => {
  const styled = {
    div: (strings: TemplateStringsArray) => {
      return ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    },
    h2: (strings: TemplateStringsArray) => {
      return ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>
    },
  }
  return { __esModule: true, default: styled }
})

import Web3ReactManager from './index'
import { injected } from '../../connectors'

describe('Web3ReactManager bridgeReady event handler', () => {
  let originalEthereum: any

  beforeEach(() => {
    jest.clearAllMocks()
    originalEthereum = (window as any).ethereum

    // Default mock: wallet active, network active
    mockUseWeb3React.mockImplementation((contextName?: string) => {
      if (contextName === 'NETWORK') {
        return {
          active: true,
          error: undefined,
          activate: jest.fn(),
        }
      }
      return {
        active: true,
        activate: mockActivate,
      }
    })
  })

  afterEach(() => {
    (window as any).ethereum = originalEthereum
    cleanup()
  })

  test('sets up bridgeReady event listener on mount when in bridge mode', () => {
    const addEventListenerSpy = jest.fn()
    const removeEventListenerSpy = jest.fn()

    ;(window as any).ethereum = {
      isSwapWalletAppsBridge: true,
      addEventListener: addEventListenerSpy,
      removeEventListener: removeEventListenerSpy,
    }

    const { unmount } = render(
      <Web3ReactManager>
        <div>App</div>
      </Web3ReactManager>
    )

    expect(addEventListenerSpy).toHaveBeenCalledTimes(1)
    expect(addEventListenerSpy).toHaveBeenCalledWith('bridgeReady', expect.any(Function))

    // Verify cleanup on unmount
    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(1)
    expect(removeEventListenerSpy).toHaveBeenCalledWith('bridgeReady', expect.any(Function))
  })

  test('bridgeReady event triggers activate(injected) when wallet not active', () => {
    let capturedHandler: (() => void) | null = null

    ;(window as any).ethereum = {
      isSwapWalletAppsBridge: true,
      addEventListener: (event: string, handler: () => void) => {
        if (event === 'bridgeReady') capturedHandler = handler
      },
      removeEventListener: jest.fn(),
    }

    // Wallet NOT active
    mockUseWeb3React.mockImplementation((contextName?: string) => {
      if (contextName === 'NETWORK') {
        return {
          active: true,
          error: undefined,
          activate: jest.fn(),
        }
      }
      return {
        active: false,
        activate: mockActivate,
      }
    })

    render(
      <Web3ReactManager>
        <div>App</div>
      </Web3ReactManager>
    )

    expect(capturedHandler).not.toBeNull()

    // Simulate bridgeReady event
    act(() => {
      capturedHandler!()
    })

    expect(mockActivate).toHaveBeenCalledWith(injected, undefined, true)
  })

  test('bridgeReady event does NOT trigger activate when wallet already active', () => {
    let capturedHandler: (() => void) | null = null

    ;(window as any).ethereum = {
      isSwapWalletAppsBridge: true,
      addEventListener: (event: string, handler: () => void) => {
        if (event === 'bridgeReady') capturedHandler = handler
      },
      removeEventListener: jest.fn(),
    }

    // Wallet IS active
    mockUseWeb3React.mockImplementation((contextName?: string) => {
      if (contextName === 'NETWORK') {
        return {
          active: true,
          error: undefined,
          activate: jest.fn(),
        }
      }
      return {
        active: true,
        activate: mockActivate,
      }
    })

    render(
      <Web3ReactManager>
        <div>App</div>
      </Web3ReactManager>
    )

    expect(capturedHandler).not.toBeNull()

    // Simulate bridgeReady event
    act(() => {
      capturedHandler!()
    })

    // activate should NOT be called because wallet is already active
    expect(mockActivate).not.toHaveBeenCalled()
  })

  test('does NOT set up bridgeReady listener when not in bridge mode', () => {
    const addEventListenerSpy = jest.fn()

    // window.ethereum exists but is NOT a bridge provider
    ;(window as any).ethereum = {
      isSwapWalletAppsBridge: false,
      addEventListener: addEventListenerSpy,
      removeEventListener: jest.fn(),
    }

    render(
      <Web3ReactManager>
        <div>App</div>
      </Web3ReactManager>
    )

    // Should NOT register bridgeReady listener
    expect(addEventListenerSpy).not.toHaveBeenCalled()
  })

  test('does NOT set up bridgeReady listener when window.ethereum is undefined', () => {
    // No ethereum provider at all
    ;(window as any).ethereum = undefined

    // Should not throw
    render(
      <Web3ReactManager>
        <div>App</div>
      </Web3ReactManager>
    )

    // If we reach here, no error was thrown — passes
  })

  test('cleanup removes event listener with same handler reference', () => {
    const listeners: Map<string, Function> = new Map()

    ;(window as any).ethereum = {
      isSwapWalletAppsBridge: true,
      addEventListener: (event: string, handler: Function) => {
        listeners.set(event, handler)
      },
      removeEventListener: (event: string, handler: Function) => {
        const storedHandler = listeners.get(event)
        // Verify the exact same function reference is used for removal
        expect(handler).toBe(storedHandler)
        listeners.delete(event)
      },
    }

    const { unmount } = render(
      <Web3ReactManager>
        <div>App</div>
      </Web3ReactManager>
    )

    expect(listeners.has('bridgeReady')).toBe(true)

    unmount()

    expect(listeners.has('bridgeReady')).toBe(false)
  })
})
