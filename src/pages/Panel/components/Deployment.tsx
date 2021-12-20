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
  margin: 0;
  padding: 0.3rem;
  font-size: 0.9rem;
  opacity: 0.7;
`

const Title = styled.h4`
  margin: 1.1em 0;
`

const Button = styled(ButtonPrimary)`
  font-size: 0.8em;
  margin-top: 0.3rem;
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

  const deployedContractsState = {
    router: '',
    factory: '',
    storage: '',
  }

  const [deployedContracts, setDeployedContracts] = useState<{
    router: string
    factory: string
    storage: string
  }>(deployedContractsState)

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
    setDeployedContracts(deployedContractsState)

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
          setDeployedContracts((prevState) => ({
            ...prevState,
            factory: receipt.contractAddress,
          }))
          addContractInfo('Factory', receipt)
        },
        onRouterDeploy: (receipt: any) => {
          setDeployedContracts((prevState) => ({
            ...prevState,
            router: receipt.contractAddress,
          }))
          addContractInfo('Router', receipt)
        },
      })
    } catch (error) {
      setError(error)
    }

    setPending(false)
  }

  const onStorageDeploy = async () => {
    setPending(true)
    setDeployedContracts((prevState) => ({
      ...prevState,
      storage: '',
    }))

    try {
      await deployStorage({
        domain,
        //@ts-ignore
        registryAddress: networks[chainId]?.registry,
        onDeploy: (receipt: any) => {
          setDeployedContracts((prevState) => ({
            ...prevState,
            storage: receipt.contractAddress,
          }))
          addContractInfo('Storage', receipt)
        },
        library,
        admin: adminAddress,
      })
    } catch (error) {
      setError(error)
    }

    setPending(false)
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
      <InputWrapper>
        <AddressInputPanel label={`${t('admin')} *`} value={adminAddress} onChange={setAdminAddress} />
      </InputWrapper>
      <InputWrapper>
        <InputPanel label={`${t('domain')} *`} value={domain} onChange={setDomain} disabled />
      </InputWrapper>

      <Title>1) {t('deploySwapContracts')}</Title>

      <Info>{t('wrappedTokenDescription')}</Info>
      <AddressInputPanel
        label={`${t('wrappedToken')} *`}
        value={wrappedToken}
        onChange={setWrappedToken}
        disabled={
          // don't allow the user to change a token address
          // in case if we have it in our config
          //@ts-ignore
          networks[chainId]?.wrappedToken?.address && wrappedToken
        }
      />

      <Button onClick={onContractsDeployment} disabled={pending || !canDeploySwapContracts}>
        {t('deploySwapContracts')}
      </Button>

      <Title>2) {t('deployStorageContract')}</Title>
      <Info>{t('deployAfterSwapContracts')}</Info>

      <Button onClick={onStorageDeploy} disabled={pending || !canDeployStorage}>
        {t('deployStorage')}
      </Button>

      <Title>{t('deploymentInformation')}</Title>

      {Object.keys(deployedContracts).map((contractKey: string, index) => {
        //@ts-ignore
        const address = deployedContracts[contractKey]

        return address ? (
          <p key={index}>
            {t(contractKey)}: {address}
          </p>
        ) : null
      })}
    </section>
  )
}
