import { Player } from "../calls/PlayersApi"
import { Team } from "../calls/TeamsApi"

export interface ItemActionModalProps {
    isOpen: boolean;
    isEdit: boolean;
    object: Player | Team | null;
    onClose: () => void;
}
  