import React from 'react';
import colors from "../../designSystem/colors";
import theme from "../../designSystem/theme";

import {
  Slider as Chakraslider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Tooltip,
  FormControl,
  FormLabel,
} from '@chakra-ui/react'

export const Slider = ({ name, id, id2, min, max, step, setSliderValue, sliderValue, label }) => {

  const [showTooltip, setShowTooltip] = React.useState(false)

  return (
    <FormControl>
      <FormLabel fontWeight={'700'} fontSize={theme.fontSize.sm} fontFamily={theme.font.header} color={colors.text.light} htmlFor={id}>{ name }</FormLabel>
        <Chakraslider
          defaultValue={sliderValue}
          id={id}
          min={min}
          max={max}
          colorScheme='teal'
          step={step}
          onChange={(v) => setSliderValue(id, v, id2)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
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