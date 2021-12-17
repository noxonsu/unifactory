import React, { useState, useEffect } from 'react'
import { AiOutlinePlus } from 'react-icons/ai'
import { ButtonPrimary } from 'components/Button'
import InputPanel from 'components/InputPanel'
import { useTranslation } from 'react-i18next'
import { saveProjectOption } from '../../../utils/storage'
import { returnTokenInfo, isValidAddress } from '../../../utils/contract'
import { storageMethods } from '../../../constants'

export function TokenList(props: any) {
  const { list, web3React, setPending, setError, setNotification, storage, isNewList } = props
  const { t } = useTranslation()
  const [tokenListName, setTokenListName] = useState(list.name || '')
  const [tokenListLogo, setTokenListLogo] = useState(list.logoURI || '')
  const [tokens, setTokens] = useState(list.tokens || [])
  const [newTokenAddress, setNewTokenAddress] = useState('')
  const [tokenAddressIsCorrect, setTokenAddressIsCorrect] = useState(true)

  useEffect(() => {
    if (web3React.library) {
      setTokenAddressIsCorrect(isValidAddress(web3React.library, newTokenAddress))
    }
  }, [web3React.library, newTokenAddress])

  const addNewToken = async () => {
    const tokenInList = tokens.find((item: any) => item.address.toLowerCase() === newTokenAddress.toLowerCase())

    if (tokenInList) return

    setError(false)
    setNotification(false)
    setPending(true)

    const tokenInfo = await returnTokenInfo(web3React.library, newTokenAddress)

    if (tokenInfo) {
      const { name, symbol, decimals } = tokenInfo

      setTokens((oldTokens: any) => [
        ...oldTokens,
        {
          name,
          symbol,
          decimals: Number(decimals),
          address: newTokenAddress,
          chainId: web3React.chainId,
        },
      ])

      setNewTokenAddress('')
    } else {
      setError(new Error('Seems it is not a token or an address from a different network. Double check it'))
    }

    setPending(false)
  }

  const removeToken = (address: string) => {
    const updatedList = tokens.filter((item: any) => item.address.toLowerCase() !== address.toLowerCase())

    setTokens(updatedList)
  }

  const saveTokenList = async () => {
    setError(false)
    setNotification(false)
    setPending(true)

    try {
      const receipt: any = await saveProjectOption(
        web3React?.library,
        storage,
        isNewList ? storageMethods.addTokenList : storageMethods.updateTokenList,
        {
          oldName: list.name,
          name: tokenListName,
          logoURI: tokenListLogo,
          tokens,
        }
      )

      if (receipt.status) {
        setNotification(`Saved in transaction: ${receipt.transactionHash}`)
      }
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
    }
  }

  return (
    <section>
      <InputPanel label={`${t('listName')} *`} value={tokenListName} onChange={setTokenListName} />
      <InputPanel label={t('logo')} value={tokenListLogo} onChange={setTokenListLogo} />

      {tokens.length ? (
        <div>
          {tokens.map((item: any, index: number) => {
            const { name, symbol, address } = item

            return (
              <div key={index}>
                <span>
                  {name} <small>({symbol})</small>:
                </span>
                <span>
                  <span>{address}</span>
                  <button type="button" onClick={() => removeToken(address)}></button>
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <p>{t('noTokens')}</p>
      )}

      <div key={newTokenAddress}>
        <InputPanel label={t('tokenAddress')} value={newTokenAddress} onChange={setNewTokenAddress} />
        <ButtonPrimary onClick={addNewToken} disabled={!tokenAddressIsCorrect}>
          <AiOutlinePlus /> {t('token')}
        </ButtonPrimary>
      </div>

      <div>
        <ButtonPrimary onClick={saveTokenList} disabled={!tokenListName || !tokens.length}>
          {isNewList ? t('saveTokenList') : t('updateTokenList')}
        </ButtonPrimary>
      </div>
    </section>
  )
}
