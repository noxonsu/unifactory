import React, { useState, useEffect } from 'react'
import { AiOutlinePlus } from 'react-icons/ai'
import { RiCloseFill } from 'react-icons/ri'
import { MdOutlineKeyboardArrowDown, MdOutlineKeyboardArrowUp } from 'react-icons/md'
import styled from 'styled-components'
import { ButtonPrimary, CleanButton } from 'components/Button'
import Input from 'components/Input'
import InputPanel from 'components/InputPanel'
import { useTranslation } from 'react-i18next'
import { saveProjectOption } from '../../../utils/storage'
import { returnTokenInfo, isValidAddress } from '../../../utils/contract'
import { storageMethods } from '../../../constants'
import { shortenAddress } from 'utils'

const Wrapper = styled.div`
  padding: 0.3rem;
  border-radius: 1.25rem;
  border: 1px solid ${({ theme }) => theme.bg3};
  background-color: ${({ theme }) => theme.bg2};
`

const Header = styled(CleanButton)`
  padding: 0.4rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const ArrowWrapper = styled.div`
  padding: 0.3rem;
`

const TokenRow = styled.div`
  margin: 0.2rem;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.bg3};

  .address {
    display: flex;
    align-items: center;
  }
`

const RemoveButton = styled(CleanButton)`
  padding: 0.3rem;
`

const Button = styled(ButtonPrimary)`
  font-size: 0.8em;
  margin-top: 0.3rem;
`

export function TokenList(props: any) {
  const { list, web3React, setPending, setError, setNotification, storage, isNewList } = props
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

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
    <Wrapper>
      <Header onClick={() => setOpen(!open)}>
        <span>{list.name}</span>
        <ArrowWrapper>{open ? <MdOutlineKeyboardArrowUp /> : <MdOutlineKeyboardArrowDown />}</ArrowWrapper>
      </Header>

      {open && (
        <>
          <Input label={`${t('listName')} *`} value={tokenListName} onChange={setTokenListName} />
          <Input label={t('logo')} value={tokenListLogo} onChange={setTokenListLogo} />

          {tokens.length ? (
            <div>
              {tokens.map(
                ({ name, symbol, address }: { name: string; symbol: string; address: string }, index: number) => (
                  <TokenRow key={index}>
                    <span>
                      {name} <small>({symbol})</small>:
                    </span>{' '}
                    <div className="address">
                      <span className="monospace">{shortenAddress(address)}</span>
                      <RemoveButton type="button" onClick={() => removeToken(address)} title="Remove token">
                        <RiCloseFill />
                      </RemoveButton>
                    </div>
                  </TokenRow>
                )
              )}
            </div>
          ) : (
            <p>{t('noTokens')}</p>
          )}

          <div key={newTokenAddress}>
            <InputPanel label={t('tokenAddress')} value={newTokenAddress} onChange={setNewTokenAddress} />
            <Button onClick={addNewToken} disabled={!tokenAddressIsCorrect}>
              <AiOutlinePlus /> {t('token')}
            </Button>
          </div>

          <div>
            <Button onClick={saveTokenList} disabled={!tokenListName || !tokens.length}>
              {isNewList ? t('saveTokenList') : t('updateTokenList')}
            </Button>
          </div>
        </>
      )}
    </Wrapper>
  )
}
