import React from 'react';

import {
  Slider as Chakraslider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Tooltip,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText
} from '@chakra-ui/react'

export const Slider = ({ name, id, min, max, setSliderValue, sliderValue, label }) => {

  const [showTooltip, setShowTooltip] = React.useState(true)

  return (
    <FormControl>
      <FormLabel htmlFor={id}>{ name }</FormLabel>
        <Chakraslider
          id={id}
          defaultValue={5}
          min={min}
          max={max}
          colorScheme='teal'
          onChange={(v) => setSliderValue(id, v)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {/* <SliderMark value={25} mt='1' ml='-2.5' fontSize='sm'>
            25%
          </SliderMark>
          <SliderMark value={50} mt='1' ml='-2.5' fontSize='sm'>
            50%
          </SliderMark>
          <SliderMark value={75} mt='1' ml='-2.5' fontSize='sm'>
            75%
          </SliderMark> */}
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <Tooltip
            hasArrow
            bg='teal.500'
            color='white'
            placement='top'
            isOpen={showTooltip}
            label={`${sliderValue}${label}`}
          >
            <SliderThumb />
          </Tooltip>
        </Chakraslider>
    </FormControl>
  )
}