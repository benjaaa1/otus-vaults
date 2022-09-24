import { useState } from 'react'
import {
  CREATE_STEPS,
  CREATE_STEP_LINKS,
  CREATE_STEP_STATUS,
} from '../../../constants/tabs'
import { Input } from '../../Common/Components/UI/Input'
import { RangeSlider } from '../../Common/Components/UI/RangeSlider'
import { Switch } from '../../Common/Components/UI/Switch'
import { TextArea } from '../../Common/Components/UI/TextArea'
import CreateSteps from './CreateSteps'
import SlideInPanel from './SlideInPanel'

export default function Create({ setOpen, open }) {
  const [step, setStep] = useState(CREATE_STEPS[0])

  return (
    <SlideInPanel setOpen={setOpen} open={open} title={'Create a Vault'}>
      <CreateSteps activeStep={step} setStep={setStep} />
      <div className="py-4">
        <form className="space-y-4 divide-y divide-zinc-700">
          <div className="space-y-4">
            {step.href == CREATE_STEP_LINKS.INFORMATION ? (
              <div className="pt-8">
                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <Input />
                  </div>

                  <div className="sm:col-span-6">
                    <Input />
                  </div>

                  <div className="sm:col-span-6">
                    <TextArea />
                  </div>

                  <div className="sm:col-span-6">
                    <RangeSlider />
                  </div>
                </div>
              </div>
            ) : null}

            {step.href == CREATE_STEP_LINKS.SETTINGS ? (
              <div className="pt-8">
                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <Switch />
                  </div>

                  <div className="sm:col-span-6">
                    <RangeSlider />
                  </div>

                  <div className="sm:col-span-6">
                    <RangeSlider />
                  </div>

                  <div className="sm:col-span-6">
                    <RangeSlider />
                  </div>

                  <div className="sm:col-span-6">
                    <RangeSlider />
                  </div>

                  <div className="sm:col-span-6">
                    <RangeSlider />
                  </div>
                </div>
              </div>
            ) : null}

            {step.href == CREATE_STEP_LINKS.STRATEGIES ? (
              <div className="pt-8">
                <div className="mt-6">
                  <div className="sm:col-span-6">
                    <RangeSlider />
                  </div>

                  <div className="sm:col-span-6">
                    <RangeSlider />
                  </div>

                  <div className="sm:col-span-6">
                    <RangeSlider />
                  </div>

                  <div className="sm:col-span-6">
                    <RangeSlider />
                  </div>

                  <div className="sm:col-span-6">
                    <RangeSlider />
                  </div>

                  <div className="sm:col-span-6">
                    <RangeSlider />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </form>
      </div>
    </SlideInPanel>
  )
}
