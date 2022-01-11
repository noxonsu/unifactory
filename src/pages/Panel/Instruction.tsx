import React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import Accordion from 'components/Accordion'

const Section = styled.div`
  margin: 1.6rem 0;

  :last-child {
    margin-bottom: 0;
  }
`

const Title = styled.h4`
  margin: 0;
  margin-bottom: 1rem;
  font-weight: 500;
`

const Paragraph = styled.p`
  :last-child {
    margin-bottom: 0;
  }
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

const Warring = styled.div`
  padding: 0.8rem;
  border-radius: 0.6rem;
  background-color: ${({ theme }) => theme.yellow1};
`

export default function Instruction() {
  const { t } = useTranslation()

  return (
    <Accordion title={t('instructions')} padding={0.2} contentPadding>
      <Section>
        <Paragraph>1) {t('swapContractsDeploymentDescription')}.</Paragraph>
        <Paragraph>2) {t('storageDeploymentDescription')}.</Paragraph>
      </Section>

      <Section>
        <Title>{t('meaningOfSections')}:</Title>
        <List>
          <li>
            <Highlight>{t('deployment')}:</Highlight> {t('deploymentSectionDescription')}.
          </li>
          <li>
            <Highlight>{t('swapContracts')}:</Highlight> {t('swapContractsSectionDescription')}.
          </li>
          <li>
            <Highlight>{t('interface')}:</Highlight> {t('interfaceSectionDescription')}.
          </li>
        </List>
      </Section>

      <Section>
        <Warring>
          <Title>{t('beCareful')}:</Title>
          <Paragraph>{t('deploymentFlowDescription')}.</Paragraph>
          <Paragraph>{t('consequencesOfDeploymentOfNewContracts')}.</Paragraph>
        </Warring>
      </Section>
    </Accordion>
  )
}
