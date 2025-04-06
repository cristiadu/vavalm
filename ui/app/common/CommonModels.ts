import { TeamApiModel, TournamentApiModel, PlayerApiModel } from "@/api/generated"

/**
 * A props object for an item action modal.
 * 
 * @param isOpen - Whether the modal is open.
 * @param isEdit - Whether the modal is in edit mode.
 * @param object - The object to be edited.
 * @param onClose - The function to close the modal.
 */
export interface ItemActionModalProps {
    isOpen: boolean;
    isEdit: boolean;
    object: PlayerApiModel | TeamApiModel | TournamentApiModel | null;
    onClose: () => void;
}
  
/**
 * A threshold is a value that is used to determine the color of a background based on a ratio or percentage.
 * 
 * @param high - The high threshold.
 * @param medium - The medium threshold.
 * @param higherIsWorse - Whether the higher the value, the worse it is.
 * @param ratioCalculation - Whether the value is a ratio.
 * @param percentageCalculation - Whether the value is a percentage.
 * @param noColor - Whether the value is not a ratio or percentage.
 */
export interface Threshold {
    high?: number
    medium?: number
    higherIsWorse?: boolean
    ratioCalculation?: boolean
    percentageCalculation?: boolean
    noColor?: boolean
  }