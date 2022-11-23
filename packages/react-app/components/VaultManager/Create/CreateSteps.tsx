import { Dispatch } from 'react'
import { CREATE_STEPS } from '../../../constants/tabs'

export default function CreateSteps({ step, setStep }: { step: number, setStep: Dispatch<number> }) {
  const setAsActiveStep = (id: number) => {
    setStep(id)
  }

  return (
    <nav aria-label="Progress">
      <ol
        role="list"
        className="divide-y divide-zinc-700 rounded-md border border-zinc-700 bg-zinc-800 md:flex md:divide-y-0"
      >
        < li key={CREATE_STEPS[0].id} className="relative md:flex md:flex-1" >
          <a
            onClick={() => setAsActiveStep(CREATE_STEPS[0].id)}
            className="group flex items-center"
          >
            <span className="flex items-center px-6 py-2 text-sm font-medium">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-zinc-700 group-hover:border-zinc-900">
                {
                  step == CREATE_STEPS[0].id ?
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-emerald-600">
                      <span className="text-zinc-200">{CREATE_STEPS[0].id}</span>
                    </span> :
                    <span className="text-zinc-200 group-hover:text-white">
                      {CREATE_STEPS[0].id}
                    </span>
                }
              </span>
              <span className="ml-4 text-sm font-medium text-zinc-200 group-hover:text-white">
                {CREATE_STEPS[0].name}
              </span>
            </span>
          </a>

          <>
            {/* Arrow separator for lg screens and up */}
            <div
              className="absolute top-0 right-0 hidden h-full w-5 md:block"
              aria-hidden="true"
            >
              <svg
                className="h-full w-full text-zinc-700"
                viewBox="0 0 22 80"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 -2L20 40L0 82"
                  vectorEffect="non-scaling-stroke"
                  stroke="currentcolor"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </>

        </li >


        <li key={CREATE_STEPS[1].id} className="relative md:flex md:flex-1">
          <a
            onClick={() => setAsActiveStep(CREATE_STEPS[1].id)}
            className="group flex items-center"
          >
            <span className="flex items-center px-6 py-2 text-sm font-medium">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-zinc-700 group-hover:border-zinc-900">
                {
                  step == CREATE_STEPS[1].id ?
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-emerald-600">
                      <span className="text-zinc-200">{CREATE_STEPS[1].id}</span>
                    </span> :
                    <span className="text-zinc-200 group-hover:text-white">
                      {CREATE_STEPS[1].id}
                    </span>
                }
              </span>
              <span className="ml-4 text-sm font-medium text-zinc-200 group-hover:text-white">
                {CREATE_STEPS[1].name}
              </span>
            </span>
          </a>
        </li>
      </ol >
    </nav >
  )
}
