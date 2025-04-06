import { Threshold } from "@/common/CommonModels"
import { getRatio } from "@/common/NumberUtils"

export const quill_config = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'], // toggled buttons
    ['blockquote', 'code-block', 'link'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
    [{ 'color': [] }, { 'background': [] }], // dropdown with defaults from theme
    [{ 'align': [] }],
  ],
}

export const getBgColorBasedOnThreshold = (value: number, thresholds: Threshold, total: number = 0): string => {
  if(thresholds.noColor) {
    return 'bg-gray-200'
  }
  
  if(thresholds.ratioCalculation) {
    value = getRatio(value, total, false)
  }
  
  if(thresholds.percentageCalculation) {
    value = getRatio(value, total, true)
  }
  
  if (thresholds.high && value >= thresholds.high) return thresholds.higherIsWorse ? 'bg-red-200' : 'bg-green-200'
  if (thresholds.medium && value >= thresholds.medium) return 'bg-yellow-200'
  return thresholds.higherIsWorse ? 'bg-green-200' : 'bg-red-200'
}

export const sortByDate = (a: Date, b: Date): number => {
  return a.getTime() - b.getTime()
}