export class EnvironmentRenderer {
  static drawEnvironmentTile(ctx, type, isDangerZone, screenX, screenY, size) {
    // 1. Base Terrain Colors
    switch (type) {
      case "grasslands":
        ctx.fillStyle = "#437c35"; // Vibrant lush green
        ctx.fillRect(screenX, screenY, size, size);
        ctx.fillStyle = "#4d8c3e";
        ctx.fillRect(screenX + 4, screenY + 6, 2, 4);
        ctx.fillRect(screenX + 18, screenY + 14, 2, 5);
        break;

      case "beach":
        ctx.fillStyle = "#d8c27a"; // Warm sand
        ctx.fillRect(screenX, screenY, size, size);
        ctx.fillStyle = "#c9b36b";
        ctx.fillRect(screenX + 8, screenY + 12, 4, 2);
        break;

      case "hillside":
        ctx.fillStyle = "#6b7c52"; // High elevation steppe
        ctx.fillRect(screenX, screenY, size, size);
        ctx.fillStyle = "#5a6845";
        ctx.fillRect(screenX + 2, screenY + 2, size - 4, size - 4);
        break;

      case "forest":
        ctx.fillStyle = "#1e4425"; // Deep canopy green
        ctx.fillRect(screenX, screenY, size, size);
        ctx.fillStyle = "#14301a";
        ctx.beginPath();
        ctx.arc(screenX + size / 2, screenY + size / 2, size / 3, 0, Math.PI * 2);
        ctx.fill();
        break;

      case "mountains":
        ctx.fillStyle = "#8a95a5"; // Alpine slate rock
        ctx.fillRect(screenX, screenY, size, size);
        ctx.fillStyle = "#f0f4f8"; // Snow cap peak
        ctx.fillRect(screenX + 6, screenY + 3, size - 12, 6);
        break;

      case "ocean":
        ctx.fillStyle = "#1d4e89"; // Deep maritime blue
        ctx.fillRect(screenX, screenY, size, size);
        ctx.fillStyle = "#2866b2"; // Wave ripple
        ctx.fillRect(screenX + 3, screenY + 8, 14, 2);
        ctx.fillRect(screenX + 14, screenY + 20, 10, 2);
        break;

      case "town":
        ctx.fillStyle = "#4c566a"; // Cobblestone plaza
        ctx.fillRect(screenX, screenY, size, size);
        ctx.fillStyle = "#3b4252";
        ctx.fillRect(screenX + 2, screenY + 2, size / 2 - 3, size / 2 - 3);
        ctx.fillRect(screenX + size / 2 + 1, screenY + size / 2 + 1, size / 2 - 3, size / 2 - 3);
        break;

      default:
        ctx.fillStyle = "#437c35";
        ctx.fillRect(screenX, screenY, size, size);
        break;
    }

    // 2. Visual Tall Grass / Danger Indicator (Intuitive Encounter Spot)
    if (isDangerZone) {
      ctx.fillStyle = "rgba(10, 30, 10, 0.35)"; // Darker zone shade
      ctx.fillRect(screenX, screenY, size, size);

      // Distinct thick tufts
      ctx.fillStyle = "#204618";
      ctx.fillRect(screenX + 3, screenY + 10, 5, 18);
      ctx.fillRect(screenX + 12, screenY + 6, 6, 22);
      ctx.fillRect(screenX + 22, screenY + 12, 5, 16);

      ctx.fillStyle = "#73a942"; // Blade highlights
      ctx.fillRect(screenX + 5, screenY + 8, 2, 12);
      ctx.fillRect(screenX + 14, screenY + 4, 2, 14);
      ctx.fillRect(screenX + 24, screenY + 10, 2, 10);
    }

    // Subtle grid seam
    ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
    ctx.strokeRect(screenX, screenY, size, size);
  }

  static drawObject(ctx, kind, screenX, screenY, size) {
    if (kind === "anvil") {
      ctx.fillStyle = "#d08770";
      ctx.fillRect(screenX + 6, screenY + 12, 20, 10);
      ctx.fillRect(screenX + 10, screenY + 22, 12, 6);
    } else if (kind === "boss") {
      ctx.fillStyle = "#bf616a";
      ctx.beginPath();
      ctx.arc(screenX + size / 2, screenY + size / 2, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ebcb8b";
      ctx.fillRect(screenX + 9, screenY + 4, 14, 5); // Golden Crown
    } else if (kind === "boat_merchant") {
      ctx.fillStyle = "#88c0d0";
      ctx.fillRect(screenX + 4, screenY + 14, 24, 12);
      ctx.fillStyle = "#d8dee9";
      ctx.fillRect(screenX + 14, screenY + 4, 3, 10); // Sail mast
    }
  }
}
