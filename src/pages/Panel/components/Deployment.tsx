import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useActiveWeb3React } from 'hooks'
import styled from 'styled-components'
import networks from 'networks.json'
import { ButtonPrimary } from 'components/Button'
import InputPanel from 'components/InputPanel'
import AddressInputPanel from 'components/AddressInputPanel'
import { deploySwapContracts, deployStorage, isValidAddress, returnTokenInfo } from 'utils/contract'

const Info = styled.p`
  padding: 0.4rem;
  font-size: 0.9rem;
  opacity: 0.6;
`

const Button = styled(ButtonPrimary)`
  width: 49%;
  font-size: 0.9em;
`

const InputWrapper = styled.div`
  margin: 0.2rem 0;
`

export function Deployment(props: any) {
  const { pending, setPending, setError, wrappedToken, setWrappedToken } = props
  const { t } = useTranslation()
  const { library, chainId } = useActiveWeb3React()

  const [canDeploySwapContracts, setCanDeploySwapContracts] = useState(false)
  const [canDeployStorage, setCanDeployStorage] = useState(false)

  const currentDomain = window.location.hostname || document.location.host
  const [domain, setDomain] = useState(currentDomain)
  const [adminAddress, setAdminAddress] = useState('')

  const [factoryAddress, setFactoryAddress] = useState('')
  const [routerAddress, setRouterAddress] = useState('')
  const [storageAddress, setStorageAddress] = useState('')

  const saveData = (key: string, value: any) => {
    const strData = window.localStorage.getItem('userDeploymentData')

    if (strData) {
      const data = JSON.parse(strData)

      data[key] = value

      window.localStorage.setItem('userDeploymentData', JSON.stringify(data))
    } else {
      window.localStorage.setItem(
        'userDeploymentData',
        JSON.stringify({
          [key]: value,
        })
      )
    }
  }

  const addContractInfo = (name: string, receipt: any) => {
    try {
      saveData(`${name}_${receipt.contractAddress}`, receipt.contractAddress)
    } catch (error) {
      setError(error)
    }
  }

  const onContractsDeployment = async () => {
    setPending(true)
    setFactoryAddress('')
    setRouterAddress('')

    try {
      //@ts-ignore
      const tokenInfo = await returnTokenInfo(library, wrappedToken)

      if (!tokenInfo) {
        return setError(new Error('It is not a wrapped token address. Double check it and try again.'))
      }

      await deploySwapContracts({
        domain,
        //@ts-ignore
        registryAddress: networks[chainId]?.registry,
        library,
        admin: adminAddress,
        wrappedToken,
        onFactoryDeploy: (receipt: any) => {
          setFactoryAddress(receipt.contractAddress)
          addContractInfo('Factory', receipt)
        },
        onRouterDeploy: (receipt: any) => {
          setRouterAddress(receipt.contractAddress)
          addContractInfo('Router', receipt)
        },
      })
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
    }
  }

  const onStorageDeploy = async () => {
    setPending(true)
    setStorageAddress('')

    try {
      await deployStorage({
        domain,
        //@ts-ignore
        registryAddress: networks[chainId]?.registry,
        onDeploy: (receipt: any) => {
          setStorageAddress(receipt.contractAddress)
          addContractInfo('Storage', receipt)
        },
        library,
        admin: adminAddress,
      })
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
    }
  }

  useEffect(() => {
    setCanDeploySwapContracts(
      //@ts-ignore
      isValidAddress(library, adminAddress) &&
        wrappedToken &&
        //@ts-ignore
        isValidAddress(library, wrappedToken)
    )
    //@ts-ignore
    setCanDeployStorage(isValidAddress(library, adminAddress))
  }, [library, adminAddress, wrappedToken])

  return (
    <section>
      <h4>1) {t('deploySwapContracts')}</h4>

      <InputWrapper>
        <InputPanel
          label="Domain *"
          value={domain}
          onChange={setDomain}
          // TODO: add the ability to change domain?
          disabled={true}
        />
      </InputWrapper>

      <AddressInputPanel label="Admin *" value={adminAddress} onChange={setAdminAddress} />

      <Info>
        {t('wrappedTokenDescription')}
        {/* Wrapped token - ERC20 token that represents a native EVM network currency (ETH, BNB, MATIC, etc.). In order the
        native currency to be exchanged with other ERC20 tokens, it needs to be wrapped. Wrapping the native currency
        does not affect its value. For example 1 ETH = 1 WETH. */}
      </Info>
      <AddressInputPanel
        label={`${t('wrappedToken')} *`}
        disabled={
          // don't allow the user to change a token address
          // in case if we have it in our config
          //@ts-ignore
          networks[chainId]?.wrappedToken?.address && wrappedToken
        }
        value={wrappedToken}
        onChange={setWrappedToken}
      />

      <Button onClick={onContractsDeployment} disabled={pending || !canDeploySwapContracts}>
        {t('deploySwapContracts')}
      </Button>

      <h4>2) {t('deployStorageContract')}</h4>

      <Button onClick={onStorageDeploy} disabled={pending || !canDeployStorage}>
        {t('deployStorage')}
      </Button>

      <h4>{t('deploymentInformation')}</h4>
      <Info>
        {t('deploymentInformation')}
        {/* You can see the latest information about deployed contracts below. Don't forget to save it. */}
      </Info>

      {factoryAddress && (
        <p>
          <strong>{t('dactory')}</strong>: {factoryAddress}
        </p>
      )}
      {routerAddress && (
        <p>
          <strong>{t('router')}</strong>: {routerAddress}
        </p>
      )}
      {storageAddress && (
        <p>
          <strong>{t('storage')}</strong>: {storageAddress}
        </p>
      )}
    </section>
  )
}
