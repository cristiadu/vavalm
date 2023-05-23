
export default function NewTeam() {
  return (
    <form className="w-full">
      <div className="flex flex-wrap -mx-1 mb-2 items-center">
        <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
          <div className="w-full mb-2 rounded border bg-white p-1 h-auto max-w-full">
          <img
            src="https://tecdn.b-cdn.net/img/new/slides/041.jpg"
            alt="..." />
            </div>
            <div className="md:w-1/3">
            <label className="uppercase tracking-wide text-gray-700 text-xs font-bold" htmlFor="grid-first-name">
            Logo
          </label>
            </div>
            <div className="md:w-2/3">
          <input className="w-full text-sm text-gray-700  bg-gray-200 border border-gray-200 rounded
      file:mr-4 file:py-3 file:px-4 focus:outline-none cursor-pointer
      file:rounded file:border-0
      file:text-sm file:font-semibold
      file:bg-blue-500 file:text-white
      hover:file:bg-blue-600" id="grid-first-name" type="file" />
      </div>
        </div>
        <div className="w-full md:w-1/2">
          <div className="w-full px-3">
            <label className="uppercase tracking-wides text-gray-700 text-xs font-bold mb-2" htmlFor="grid-last-name">
              Full Name
            </label>
            <input className="w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="grid-last-name" type="text" placeholder="Doe" />
          </div>
          <div className="w-full px-3">
            <label className="uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="grid-password">
              Short Name
            </label>
            <input className="w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="grid-last-name" type="text" placeholder="Doe" />
          </div>
          <div className="w-full px-3">
            <label className="uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="grid-state">
              Country
            </label>
            <div className="relative">
              <select className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="grid-state">
                <option>New Mexico</option>
                <option>Missouri</option>
                <option>Texas</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap -mx-1 mb-2">
        <div className="w-full px-3">
          <label className="uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="grid-password">
            Description
          </label>
          <textarea className="w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="grid-password"></textarea>
        </div>
      </div>
    </form>
  )
}
