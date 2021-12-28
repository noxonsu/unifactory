import React, { useState } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io'
import { CleanButton } from 'components/Button'

const Wrapper = styled.section`
  margin: 0.5rem 0;
  padding: 0.4rem 0.8rem;
  text-align: left;
  border-radius: 0.6rem;
  border: 1px solid ${({ theme }) => theme.bg3};
  background-color: ${({ theme }) => theme.bg2};
`

const Toogle = styled(CleanButton)`
  width: 100%;
  margin: 0;
  padding: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const IconWrapper = styled.div`
  margin-left: 0.4rem;
  margin-top: 0.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Title = styled.h4`
  margin: 2rem 0 1rem;
  font-weight: 500;
`

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    padding: 0.3rem 0;
    color: ${({ theme }) => theme.text2};

    span {
      color: ${({ theme }) => theme.text1};
    }
  }
`

const Highlight = styled.span`
  font-weight: 500;
`

export default function Instruction() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <Wrapper>
      <Toogle onClick={() => setOpen((prevState) => !prevState)}>
        {t('instructions')}
        <IconWrapper>{open ? <IoIosArrowUp size="1.1rem" /> : <IoIosArrowDown size="1.1rem" />}</IconWrapper>
      </Toogle>

      {open && (
        <div>
          <p>1) {t('swapContractsDeploymentDescription')}</p>
          <p>2) {t('storageDeploymentDescription')}</p>

          <Title>{t('meaningOfSections')}:</Title>

          <List>
            <li>
              <Highlight>{t('deployment')}:</Highlight> {t('deploymentSectionDescription')}
            </li>
            <li>
              <Highlight>{t('swapContracts')}:</Highlight> {t('swapContractsSectionDescription')}
            </li>
            <li>
              <Highlight>{t('interface')}:</Highlight> {t('interfaceSectionDescription')}
            </li>
          </List>
        </div>
      )}
    </Wrapper>
  )
}
