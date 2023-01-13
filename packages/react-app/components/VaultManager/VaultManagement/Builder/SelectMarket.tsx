import React, { Dispatch } from 'react'
import { LyraBoard, LyraMarket } from '../../../../utils/types/lyra'
import BTCIcon from '../../../UI/Components/Icons/Color/BTC'
import ETHIcon from '../../../UI/Components/Icons/Color/ETH'


export const LyraMarketOptions = (
  {
    markets,
    selectedMarket,
    setSelectedMarket,
  }: {
    markets: LyraMarket[]
    selectedMarket: LyraMarket | null | undefined
    setSelectedMarket: Dispatch<any>
  }
) => {

  return <div className='grid grid-cols-2'>
    {
      markets
        .filter(({ liveBoards }: { liveBoards: LyraBoard[] }) => liveBoards.length > 0)
        .map((market: LyraMarket, index: number) => {
          const { name } = market;
          const isSelected = selectedMarket?.name == name;
          const selectedClass = isSelected ? 'border-emerald-700' : 'border-zinc-700'
          return <div
            key={index}
            onClick={() => {
              setSelectedMarket && setSelectedMarket(market);
            }}
            className={`col-span-1 p-1 border hover:border-emerald-700 first:sm:mr-1 last:sm:ml-1 cursor-pointer ${selectedClass}`}>
            <div className="flex items-center p-1">
              {name == 'ETH' && <ETHIcon />}
              {name == 'BTC' && <BTCIcon />}
              <div className="pl-2">
                <strong className='text-white'> {name}</strong>
              </div>
            </div>
          </div>
        })
    }
  </div>
}
