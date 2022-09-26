import React, { FC, useState } from 'react'
import ETHIcon from '../../../../../assets/svg/currencies/crypto/ETH.svg'
import BTCIcon from '../../../../../assets/svg/currencies/crypto/BTC.svg'
import LINKIcon from '../../../../../assets/svg/currencies/crypto/LINK.svg'

import {
  CRYPTO_CURRENCY_MAP,
  CurrencyKey,
} from '../../../../constants/currency'

export type CurrencyIconProps = {
  currencyKey: string
  type?: 'synth' | 'asset' | 'token'
  className?: string
  width?: string
  height?: string
}

export const SNXIcon =
  'https://raw.githubusercontent.com/Synthetixio/synthetix-assets/master/snx/SNX.svg'

export const getSynthIcon = (currencyKey: CurrencyKey) =>
  `https://raw.githubusercontent.com/Synthetixio/synthetix-assets/master/synths/${currencyKey}.svg`

const CurrencyIconContainer: FC<CurrencyIconProps> = (props) => (
  <div className="relative flex items-center">
    <CurrencyIcon {...props} />
  </div>
)

const CurrencyIcon: FC<CurrencyIconProps> = ({
  currencyKey,
  type,
  ...rest
}) => {
  const props = {
    width: '40px',
    height: '40px',
    alt: currencyKey,
    ...rest,
  }

  switch (currencyKey) {
    case CRYPTO_CURRENCY_MAP.SNX: {
      return <img src={SNXIcon} {...props} alt="snx-icon" />
    }
    default:
      return (
        <img
          className=""
          src={getSynthIcon(currencyKey as CurrencyKey)}
          {...props}
          alt={currencyKey}
        />
      )
  }
}

export default CurrencyIconContainer
