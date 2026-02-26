// Mock dependencies before importing the module under test
const mockActivate = jest.fn().mockResolvedValue(undefined)
const mockSetTried = jest.fn()
const mockIsAuthorized = jest.fn().mockResolvedValue(false)
const mockWaitForBridgeReady = jest.fn()

// Track useEffect callbacks
const mockEffectCallbacks: Array<() => void | (() => void)> = []
// State tracking for useState
const mockStateStore: Map<number, any> = new Map()
let mockStateIdx = 0

jest.mock('@web3-react/core', () => ({
  useWeb3React: jest.fn(() => ({
    activate: mockActivate,
    active: false,
  })),
}))

jest.mock('react-device-detect', () => ({
  isMobile: false,
}))

jest.mock('react', () => ({
  useState: jest.fn((initial: any) => {
    const idx = mockStateIdx++
    if (!mockStateStore.has(idx)) {
      mockStateStore.set(idx, initial)
    }
    return [mockStateStore.get(idx), mockSetTried]
  }),
  useEffect: jest.fn((cb: () => void | (() => void)) => {
    mockEffectCallbacks.push(cb)
  }),
}))

jest.mock('../connectors', () => ({
  injected: {
    isAuthorized: () => mockIsAuthorized(),
  },
}))

jest.mock('../constants', () => ({
  NetworkContextName: 'NETWORK',
}))

jest.mock('../utils/walletBridge', () => ({
  waitForBridgeReady: (...args: any[]) => mockWaitForBridgeReady(...args),
}))

// Import after mocks are set up
import { useEagerConnect } from './index'

describe('useEagerConnect', () => {
  const originalEthereum = (window as any).ethereum

  beforeEach(() => {
    jest.clearAllMocks()
    mockEffectCallbacks.length = 0
    mockStateStore.clear()
    mockStateIdx = 0
    ;(window as any).ethereum = undefined
  })

  afterAll(() => {
    ;(window as any).ethereum = originalEthereum
  })

  /**
   * Flush microtask queue to let nested Promise chains settle.
   * Needed when the effect triggers chained Promises (e.g., catch -> isAuthorized -> then).
   */
  function flushPromises(): Promise<void> {
    return new Promise((resolve) => setImmediate(resolve))
  }

  /**
   * Helper: call the hook and return the first useEffect callback
   * (the main connection effect)
   */
  function getMainEffect(): () => void {
    useEagerConnect()
    // The first useEffect is the main connection logic
    expect(mockEffectCallbacks.length).toBeGreaterThanOrEqual(1)
    return mockEffectCallbacks[0]
  }

  describe('bridge mode - ready provider', () => {
    it('activates immediately without calling isAuthorized when bridge is ready', async () => {
      // Arrange: bridge provider present
      ;(window as any).ethereum = {
        isSwapWalletAppsBridge: true,
        isConnected: () => true,
      }
      mockWaitForBridgeReady.mockResolvedValue(true)

      // Act: run the hook's main effect
      const effect = getMainEffect()
      await effect()

      // Assert: waitForBridgeReady called with 5000ms timeout
      expect(mockWaitForBridgeReady).toHaveBeenCalledWith(5000)

      // Assert: activate called with injected connector
      expect(mockActivate).toHaveBeenCalledTimes(1)
      expect(mockActivate).toHaveBeenCalledWith(
        expect.objectContaining({ isAuthorized: expect.any(Function) }),
        undefined,
        true
      )

      // Assert: isAuthorized was NOT called (bridge mode bypasses it)
      expect(mockIsAuthorized).not.toHaveBeenCalled()
    })
  })

  describe('bridge mode - timeout fallback', () => {
    it('falls back to standard flow when bridge times out', async () => {
      // Arrange: bridge provider present but never becomes ready
      ;(window as any).ethereum = {
        isSwapWalletAppsBridge: true,
        isConnected: () => false,
      }
      mockWaitForBridgeReady.mockRejectedValue(new Error('Bridge ready timeout after 5000ms'))
      mockIsAuthorized.mockResolvedValue(true)

      // Act
      const effect = getMainEffect()
      // Suppress console.warn from bridge timeout handler
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      await effect()
      // Flush nested Promise chains (catch -> standardEagerConnect -> isAuthorized.then)
      await flushPromises()
      warnSpy.mockRestore()

      // Assert: waitForBridgeReady was attempted
      expect(mockWaitForBridgeReady).toHaveBeenCalledWith(5000)

      // Assert: fell back to standard flow - isAuthorized was called
      expect(mockIsAuthorized).toHaveBeenCalled()

      // Assert: since isAuthorized returned true, activate was called
      expect(mockActivate).toHaveBeenCalled()
    })

    it('sets tried to true when bridge times out and isAuthorized returns false', async () => {
      // Arrange
      ;(window as any).ethereum = {
        isSwapWalletAppsBridge: true,
        isConnected: () => false,
      }
      mockWaitForBridgeReady.mockRejectedValue(new Error('Bridge ready timeout after 5000ms'))
      mockIsAuthorized.mockResolvedValue(false)

      // Act
      const effect = getMainEffect()
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      await effect()
      // Flush nested Promise chains
      await flushPromises()
      warnSpy.mockRestore()

      // Assert: fell back to standard flow
      expect(mockIsAuthorized).toHaveBeenCalled()

      // Assert: tried set to true since not authorized and not mobile
      expect(mockSetTried).toHaveBeenCalledWith(true)
    })
  })

  describe('standalone mode - no bridge', () => {
    it('calls isAuthorized and activates when previously authorized (standard flow)', async () => {
      // Arrange: no bridge provider
      ;(window as any).ethereum = undefined
      mockIsAuthorized.mockResolvedValue(true)

      // Act
      const effect = getMainEffect()
      await effect()

      // Assert: bridge detection NOT triggered
      expect(mockWaitForBridgeReady).not.toHaveBeenCalled()

      // Assert: standard flow - isAuthorized called
      expect(mockIsAuthorized).toHaveBeenCalled()

      // Assert: activate called since isAuthorized returned true
      expect(mockActivate).toHaveBeenCalled()
    })

    it('sets tried when not authorized in standalone mode', async () => {
      // Arrange: no bridge, not authorized
      ;(window as any).ethereum = undefined
      mockIsAuthorized.mockResolvedValue(false)

      // Act
      const effect = getMainEffect()
      await effect()

      // Assert: standard flow
      expect(mockWaitForBridgeReady).not.toHaveBeenCalled()
      expect(mockIsAuthorized).toHaveBeenCalled()

      // Assert: tried set to true
      expect(mockSetTried).toHaveBeenCalledWith(true)
    })

    it('does not trigger bridge flow when ethereum exists but without bridge flag', async () => {
      // Arrange: regular MetaMask provider (no bridge flag)
      ;(window as any).ethereum = {
        isMetaMask: true,
        // isSwapWalletAppsBridge is NOT set
      }
      mockIsAuthorized.mockResolvedValue(true)

      // Act
      const effect = getMainEffect()
      await effect()

      // Assert: no bridge detection
      expect(mockWaitForBridgeReady).not.toHaveBeenCalled()

      // Assert: standard flow used
      expect(mockIsAuthorized).toHaveBeenCalled()
      expect(mockActivate).toHaveBeenCalled()
    })
  })
})
