import { Player } from "../calls/PlayersApi"
import { Team } from "../calls/TeamsApi"
import { Tournament } from "../calls/TournamentsApi";

export interface ItemActionModalProps {
    isOpen: boolean;
    isEdit: boolean;
    object: Player | Team | Tournament | null;
    onClose: () => void;
}
  