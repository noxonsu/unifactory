// --- Mocks must be declared before any imports that use them ---

// Mock useWeb3React to control `active` state
const mockUseWeb3React = jest.fn()
jest.mock('@web3-react/core', () => ({
  useWeb3React: () => mockUseWeb3React(),
  UnsupportedChainIdError: class UnsupportedChainIdError extends Error {},
}))

// Mock hooks/index (useActiveWeb3React)
jest.mock('hooks', () => ({
  useActiveWeb3React: () => mockUseWeb3React(),
}))

// Mock state/application/hooks
const mockWalletModalOpen = jest.fn().mockReturnValue(false)
const mockToggleWalletModal = jest.fn()
jest.mock('state/application/hooks', () => ({
  useModalOpen: () => mockWalletModalOpen(),
  useWalletModalToggle: () => mockToggleWalletModal,
}))

// Mock hooks used by WalletModal
jest.mock('hooks/usePrevious', () => ({
  __esModule: true,
  default: () => undefined,
}))

jest.mock('hooks/useWindowSize', () => ({
  useWindowSize: () => ({ width: 1024, height: 768 }),
}))

jest.mock('hooks/useWordpressInfo', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('state/user/hooks', () => ({
  useIsDarkMode: () => false,
}))

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Mock react-device-detect
jest.mock('react-device-detect', () => ({
  isMobile: false,
}))

// Mock styled-components — return simple divs using require inside factory
jest.mock('styled-components', () => {
  const mockReact = require('react')
  const mockStyled: any = new Proxy(
    (Component: any) => {
      const fn = (..._args: any[]) => {
        return (props: any) => mockReact.createElement(Component || 'div', props)
      }
      fn.attrs = () => fn
      return fn
    },
    {
      get: (_target: any, prop: string) => {
        if (prop === '__esModule') return true
        const fn = (..._args: any[]) => {
          return (props: any) => mockReact.createElement(prop, props)
        }
        fn.attrs = () => fn
        return fn
      },
    }
  )
  return {
    __esModule: true,
    default: mockStyled,
    css: (..._args: any[]) => '',
  }
})

// Mock Modal to simplify rendering — render children only if isOpen
jest.mock('../Modal', () => {
  const mockReact = require('react')
  return {
    __esModule: true,
    default: ({ isOpen, children }: { isOpen: boolean; children: any }) => {
      if (!isOpen) return null
      return mockReact.createElement('div', { 'data-testid': 'wallet-modal' }, children)
    },
  }
})

// Mock other components
jest.mock('../AccountDetails', () => {
  const mockReact = require('react')
  return {
    __esModule: true,
    default: () => mockReact.createElement('div', { 'data-testid': 'account-details' }),
  }
})

jest.mock('./Option', () => {
  const mockReact = require('react')
  return {
    __esModule: true,
    default: () => mockReact.createElement('div', { 'data-testid': 'option' }),
  }
})

jest.mock('./PendingView', () => {
  const mockReact = require('react')
  return {
    __esModule: true,
    default: () => mockReact.createElement('div', { 'data-testid': 'pending-view' }),
  }
})

// Mock connectors
jest.mock('connectors', () => ({
  injected: {},
  Network: jest.fn(),
  SUPPORTED_NETWORKS: {},
  newWalletlink: jest.fn(),
  newWalletConnect: jest.fn(),
}))

// Mock constants
jest.mock('../../constants', () => ({
  SUPPORTED_WALLETS: {},
  WALLET_NAMES: {
    METAMASK: 'MetaMask',
    WALLET_CONNECT: 'WalletConnect',
    WALLET_LINK: 'WalletLink',
    INJECTED: 'Injected',
  },
}))

// Mock utils/wallet
jest.mock('utils/wallet', () => ({
  switchInjectedNetwork: jest.fn(),
}))

// Mock assets
jest.mock('assets/images', () => ({
  CURRENCY: {},
}))

jest.mock('assets/images/metamask.png', () => 'metamask-icon')
jest.mock('assets/images/x.svg', () => ({
  ReactComponent: (props: any) => null,
}))

jest.mock('networks.json', () => ({}), { virtual: true })

// Mock state/application/actions
jest.mock('state/application/actions', () => ({
  ApplicationModal: {
    WALLET: 'WALLET',
  },
}))

// --- Imports ---
import React from 'react'
import { render } from '@testing-library/react'
import WalletModal from './index'

// --- Helpers ---
function setWindowEthereum(value: any) {
  Object.defineProperty(window, 'ethereum', {
    value,
    writable: true,
    configurable: true,
  })
}

function clearWindowEthereum() {
  Object.defineProperty(window, 'ethereum', {
    value: undefined,
    writable: true,
    configurable: true,
  })
}

// --- Tests ---

describe('WalletModal bridge suppression', () => {
  const defaultWeb3React = {
    active: false,
    chainId: 1,
    account: undefined,
    connector: undefined,
    activate: jest.fn(),
    error: undefined,
    library: undefined,
    deactivate: jest.fn(),
    setError: jest.fn(),
  }

  beforeEach(() => {
    mockUseWeb3React.mockReturnValue(defaultWeb3React)
    mockWalletModalOpen.mockReturnValue(true)
    clearWindowEthereum()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    clearWindowEthereum()
  })

  test('test_modal_suppressed_in_bridge_mode', () => {
    // Bridge mode active AND wallet connected
    setWindowEthereum({ isSwapWalletAppsBridge: true, isMetaMask: true })
    mockUseWeb3React.mockReturnValue({ ...defaultWeb3React, active: true })
    mockWalletModalOpen.mockReturnValue(true)

    const { container } = render(
      <WalletModal pendingTransactions={[]} confirmedTransactions={[]} />
    )

    // Modal should return null — nothing rendered
    expect(container.innerHTML).toBe('')
  })

  test('test_modal_shown_bridge_not_connected', () => {
    // Bridge mode active but wallet NOT connected
    setWindowEthereum({ isSwapWalletAppsBridge: true, isMetaMask: true })
    mockUseWeb3React.mockReturnValue({ ...defaultWeb3React, active: false })
    mockWalletModalOpen.mockReturnValue(true)

    const { container } = render(
      <WalletModal pendingTransactions={[]} confirmedTransactions={[]} />
    )

    // Modal should render (fallback scenario)
    expect(container.innerHTML).not.toBe('')
  })

  test('test_modal_shown_standalone_mode', () => {
    // No bridge — standalone mode (window.ethereum without bridge flag)
    setWindowEthereum({ isMetaMask: true })
    mockUseWeb3React.mockReturnValue({ ...defaultWeb3React, active: false })
    mockWalletModalOpen.mockReturnValue(true)

    const { container } = render(
      <WalletModal pendingTransactions={[]} confirmedTransactions={[]} />
    )

    // Modal should render normally
    expect(container.innerHTML).not.toBe('')
  })

  test('test_modal_shown_standalone_no_ethereum', () => {
    // No window.ethereum at all
    clearWindowEthereum()
    mockUseWeb3React.mockReturnValue({ ...defaultWeb3React, active: false })
    mockWalletModalOpen.mockReturnValue(true)

    const { container } = render(
      <WalletModal pendingTransactions={[]} confirmedTransactions={[]} />
    )

    // Modal should render normally
    expect(container.innerHTML).not.toBe('')
  })

  test('test_modal_shown_bridge_flag_false', () => {
    // Bridge flag explicitly false
    setWindowEthereum({ isSwapWalletAppsBridge: false, isMetaMask: true })
    mockUseWeb3React.mockReturnValue({ ...defaultWeb3React, active: true })
    mockWalletModalOpen.mockReturnValue(true)

    const { container } = render(
      <WalletModal pendingTransactions={[]} confirmedTransactions={[]} />
    )

    // Modal should render normally (bridge flag is false)
    expect(container.innerHTML).not.toBe('')
  })
})
