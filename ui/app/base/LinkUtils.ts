import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

const EXCEPTION_PATTERNS = [/\/tournaments\/.+\/logs/, /\/exception2/]

export const handleBackClick = (
  e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  router: AppRouterInstance,
) => {
  e.preventDefault()

  // Get the current pathname
  let pathSegments = [] as string[]
  //let pathSegments = window.location.pathname.split('/').filter(segment => segment)

  while (pathSegments.length > 0) {
    // Remove the last segment to get the parent path
    pathSegments.pop()
    // Join the segments back into a path
    const parentPath = '/' + pathSegments.join('/')

    // Check if the parent path matches any pattern in the exceptions list
    const isException = EXCEPTION_PATTERNS.some(pattern => pattern.test(parentPath))
    if (!isException) {
      console.debug('Navigating to parent path', parentPath)
      router.push(parentPath || '/')
      return
    }
  }

  // If no valid parent path found, navigate to root
  console.debug('Navigating to root')
  router.push('/')
}