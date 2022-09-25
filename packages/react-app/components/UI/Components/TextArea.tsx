export const TextArea = () => {
  return (
    <>
      <label
        htmlFor="vault-description"
        className="block text-sm font-medium text-zinc-500"
      >
        Vault Description
      </label>
      <div className="mt-1">
        <textarea
          id="vault-description"
          name="vault-description"
          rows={3}
          className="block w-full rounded-md border-zinc-700 bg-zinc-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          defaultValue={''}
        />
      </div>
      <p className="mt-2 text-sm text-zinc-500">
        Write a few sentences about the vault strategy.
      </p>
    </>
  )
}
