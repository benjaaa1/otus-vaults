const people = [
  {
    name: 'Lindsay Walton',
    title: 'Front-end Developer',
    email: 'lindsay.walton@example.com',
    role: 'Member',
  },
]

export default function Current() {
  // positions in vaults

  return (
    <div>
      <div className="overflow-hidden bg-zinc-800">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-800">
            <tr>
              <th
                scope="col"
                className="text-md p-4 text-left font-semibold text-zinc-400 sm:pl-6"
              >
                Name
              </th>
              <th
                scope="col"
                className="text-md hidden p-4 text-left font-semibold text-zinc-400 sm:table-cell"
              >
                Title
              </th>
              <th
                scope="col"
                className="text-md hidden p-4 text-left font-semibold text-zinc-400 lg:table-cell"
              >
                Email
              </th>
              <th
                scope="col"
                className="text-md p-4 text-left font-semibold text-zinc-400"
              >
                Role
              </th>
              <th scope="col" className="relative p-4 sm:pr-6">
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700">
            {people.map((person) => (
              <tr key={person.email}>
                <td className="text-md whitespace-nowrap p-4 font-medium text-zinc-200 sm:pl-6">
                  {person.name}
                </td>
                <td className="text-md hidden whitespace-nowrap p-4 text-zinc-200 sm:table-cell">
                  {person.title}
                </td>
                <td className="text-md hidden whitespace-nowrap p-4 text-zinc-200 lg:table-cell">
                  {person.email}
                </td>
                <td className="text-md whitespace-nowrap p-4 text-zinc-200">
                  {person.role}
                </td>
                <td className="whitespace-nowrap p-4 text-right text-sm font-medium sm:pr-6">
                  <a href="#" className="text-indigo-600 hover:text-indigo-900">
                    Edit<span className="sr-only">, {person.name}</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
