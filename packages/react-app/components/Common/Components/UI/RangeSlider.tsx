export const RangeSlider = ({ label }) => {
  return (
    <>
      <label
        htmlFor="medium-range"
        className="mb-2 block text-sm font-medium text-zinc-500 dark:text-zinc-300"
      >
        {label}
      </label>
      <input
        data-tooltip-target="tooltip-default"
        id="medium-range"
        type="range"
        value="50"
        className="mb-6 h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-700 dark:bg-gray-700"
      ></input>
    </>
  )
}
