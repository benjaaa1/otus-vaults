import {
  LyraBoard,
  LyraMarket,
  LyraStrike,
  useLyraMarket,
} from '../../../../queries/lyra/useLyra'
import SelectStrikes from './SelectStrikes'
import SelectExpiry from './SelectExpiry'
import SelectOptionType from './SelectOptionType'
import SelectMarket from './SelectMarket'
import { useEffect, useState } from 'react'
import { Spinner } from '../../../UI/Components/Spinner'

const calculateOptionType = (isLong: boolean, isCall: boolean) => {
  if (isLong && isCall) {
    return 0
  } else if (isLong && !isCall) {
    return 1
  } else if (!isLong && isCall) {
    return 3
  }
  //short put
  return 4
}

export default function Trade() {
  const { data, isLoading } = useLyraMarket() // return markets, boards
  const [selectedMarket, setSelectedMarket] = useState<LyraMarket>()
  const [isLong, setLong] = useState(true)
  const [isCall, setCall] = useState(true)
  const [selectedOptionType, setSelectedOptionType] = useState(0)
  const [strikes, setStrikes] = useState<LyraStrike[]>([])

  useEffect(() => {
    const _optionType = calculateOptionType(isLong, isCall)
    setSelectedOptionType(_optionType)
  }, [isLong, isCall])

  const [selectedExpiry, setSelectedExpiry] = useState<
    LyraBoard | null | undefined
  >(null)

  useEffect(() => {
    setSelectedExpiry(null)
  }, [selectedMarket])

  useEffect(() => {
    if (selectedExpiry != null && selectedExpiry.strikesByOptionTypes != null) {
      const _strikes = selectedExpiry?.strikesByOptionTypes[selectedOptionType]
      setStrikes(_strikes)
    } else {
      setStrikes([])
    }
  }, [selectedOptionType, selectedExpiry])

  return (
    <div>
      <div className="py-2">
        <>
          <div className="grid grid-cols-1 gap-1 sm:m-4 md:grid-cols-5">
            <div className="rounded-lg p-2">
              <SelectMarket
                markets={data}
                selectedMarket={selectedMarket}
                setSelectedMarket={setSelectedMarket}
              />
            </div>
            <div className="rounded-lg p-2 sm:col-span-2">
              <SelectOptionType
                isLong={isLong}
                isCall={isCall}
                setLong={setLong}
                setCall={setCall}
              />
            </div>
            <div className="rounded-lg p-2 sm:col-span-2">
              <SelectExpiry
                boards={selectedMarket ? selectedMarket?.liveBoards : []}
                selectedExpiry={selectedExpiry}
                setSelectedExpiry={setSelectedExpiry}
              />
            </div>
          </div>
          {
            isLoading ?
              <Spinner /> :
              <SelectStrikes
                selectedStrikes={strikes}
                selectedOptionType={selectedOptionType}
              />
          }

        </>

      </div>
    </div>
  )
}
