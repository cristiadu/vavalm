import { AppRouterInstance } from "next/dist/shared/lib/app-router-context"

export const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, router: AppRouterInstance) => {
  e.preventDefault()
  const referrer = document.referrer
  const isInternal = referrer && referrer.includes(window.location.hostname)
  if (isInternal && referrer !== '') {
    router.back()
  } else {
    router.push('/')
  }
}