import { Player } from "../api/models/Player"
import { Team } from "../api/models/Team"
import { Tournament } from "../api/models/Tournament"

export interface ItemActionModalProps {
    isOpen: boolean;
    isEdit: boolean;
    object: Player | Team | Tournament | null;
    onClose: () => void;
}
  