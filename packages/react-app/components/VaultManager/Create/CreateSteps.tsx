import { CheckIcon } from '@heroicons/react/24/solid'
import { CREATE_STEPS, CREATE_STEP_STATUS } from '../../../constants/tabs'

export default function CreateSteps({ activeStep, setStep }) {
  return (
    <nav aria-label="Progress">
      <ol
        role="list"
        className="divide-y divide-zinc-700 rounded-md border border-zinc-700 bg-zinc-800 md:flex md:divide-y-0"
      >
        {CREATE_STEPS.map((step, stepIdx) => (
          <li key={step.name} className="relative md:flex md:flex-1">
            {activeStep.status === CREATE_STEP_STATUS.CURRENT ? (
              <a
                onClick={() => setStep(step)}
                className="group flex w-full items-center"
              >
                <span className="flex items-center px-6 py-4 text-sm font-medium">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 group-hover:bg-emerald-800">
                    <CheckIcon
                      className="h-6 w-6 text-white"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="ml-4 text-sm font-medium text-zinc-200">
                    {step.name}
                  </span>
                </span>
              </a>
            ) : activeStep.status === CREATE_STEP_STATUS.UPCOMING ? (
              <a
                onClick={() => setStep(step)}
                className="flex items-center px-6 py-4 text-sm font-medium"
                aria-current="step"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-indigo-600">
                  <span className="text-zinc-200">{step.id}</span>
                </span>
                <span className="ml-4 text-sm font-medium text-zinc-200">
                  {step.name}
                </span>
              </a>
            ) : (
              <a
                onClick={() => setStep(step)}
                className="group flex items-center"
              >
                <span className="flex items-center px-6 py-4 text-sm font-medium">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-zinc-700 group-hover:border-zinc-900">
                    <span className="text-zinc-200 group-hover:text-white">
                      {step.id}
                    </span>
                  </span>
                  <span className="ml-4 text-sm font-medium text-zinc-200 group-hover:text-white">
                    {step.name}
                  </span>
                </span>
              </a>
            )}

            {stepIdx !== CREATE_STEPS.length - 1 ? (
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
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  )
}
