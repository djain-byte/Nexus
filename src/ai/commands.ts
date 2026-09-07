import { useAppStore } from "@/stores/useAppStore";
import { CARD_MODULES } from "@/utils/constants";
import { ParsedAction } from "./brain";

export class CommandEngine {
  execute(action: ParsedAction): string {
    const store = useAppStore.getState();

    switch (action.action) {
      case "open_card": {
        const target = action.target?.toLowerCase();
        const module = CARD_MODULES.find(
          (m) => m.id === target || m.title.toLowerCase() === target
        );
        if (module) {
          store.setExpandedCard(module.id);
          store.setActiveModule(module.id);
          return `Opened ${module.title}`;
        }
        return `Module "${action.target}" not found`;
      }

      case "close_card": {
        store.setExpandedCard(null);
        store.setActiveModule(null);
        return "Card closed";
      }

      case "rotate_left": {
        const current = store.targetAngle;
        store.setTargetAngle(current + Math.PI / 5);
        return "Rotated left";
      }

      case "rotate_right": {
        const current = store.targetAngle;
        store.setTargetAngle(current - Math.PI / 5);
        return "Rotated right";
      }

      case "navigate": {
        if (action.url) {
          window.open(action.url, "_blank");
          return `Navigating to ${action.url}`;
        }
        return "No URL provided";
      }

      default:
        return `Unknown action: ${action.action}`;
    }
  }
}

export const commandEngine = new CommandEngine();
