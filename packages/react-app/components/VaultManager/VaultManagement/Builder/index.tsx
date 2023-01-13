import { useEffect, useState } from "react"
import { useLyraMarket } from "../../../../queries/lyra/useLyra"
import { Strategy, StrategyDirection } from "../../../../utils/builder/types"
import { LyraBoard, LyraMarket } from "../../../../utils/types/lyra"
import { Spinner } from "../../../UI/Components/Spinner"
import { SelectDirectionType } from "./SelectDirectionType"
import { SelectBuilderExpiration } from "./SelectExpiration"
import { LyraMarketOptions } from "./SelectMarket"
import { Strategies } from "./Strategy"

export const Builder = () => {

  const { data, isLoading } = useLyraMarket() // return markets, boards

  const [selectedMarket, setSelectedMarket] = useState<LyraMarket>()

  const [selectedDirectionTypes, setSelectedDirectionTypes] = useState<StrategyDirection[]>([]);

  const [selectedExpiry, setSelectedExpiry] = useState<
    LyraBoard | null | undefined
  >(null)

  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>()

  useEffect(() => {
    setSelectedExpiry(null)
  }, [selectedMarket])

  return <div>
    <div className="py-2">
      {
        isLoading ?

          <div className='mt-4'>
            <Spinner />
          </div>
          :
          <>
            <div className="grid grid-cols-1 gap-1 sm:m-4 md:grid-cols-3">

              <>
                <div className="col-span-1">
                  {data && <LyraMarketOptions
                    markets={data}
                    selectedMarket={selectedMarket}
                    setSelectedMarket={setSelectedMarket}
                  />}
                </div>
                <div className="col-span-1">
                  {
                    data &&
                    <SelectDirectionType
                      selectedDirectionTypes={selectedDirectionTypes}
                      setSelectedDirectionTypes={setSelectedDirectionTypes}
                    />
                  }
                </div>
                <div>
                  {
                    selectedMarket &&
                    <SelectBuilderExpiration
                      selectedMarket={selectedMarket}
                      selectedExpirationDate={selectedExpiry}
                      setSelectedExpirationDate={setSelectedExpiry}
                    />
                  }
                </div>
              </>

            </div>

            <div className="m-4 gap-6">
              {selectedMarket && selectedDirectionTypes.length > 0 && selectedExpiry &&
                <Strategies
                  selectedMarket={selectedMarket}
                  selectedDirectionTypes={selectedDirectionTypes}
                  selectedExpirationDate={selectedExpiry}
                  selectedStrategy={selectedStrategy}
                  setSelectedStrategy={setSelectedStrategy}
                />}
            </div>

          </>
      }
    </div>
  </div>
}