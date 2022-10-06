import { MONTHS } from '../../constants/dates'

export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  const month = MONTHS[date.getMonth()]
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()

  return `${month} ${day}, ${hours}:${minutes}`
}
