export class EnvironmentRenderer {
  static drawEnvironmentTile(ctx, type, screenX, screenY, size) {
    if (type === "grass") {
      ctx.fillStyle = "#2d4a22";
      ctx.fillRect(screenX, screenY, size, size);
      ctx.fillStyle = "#385e2b";
      ctx.fillRect(screenX + 4, screenY + 6, 2, 6);
      ctx.fillRect(screenX + 18, screenY + 16, 2, 8);
    } else if (type === "beach") {
      ctx.fillStyle = "#c2b280";
      ctx.fillRect(screenX, screenY, size, size);
      ctx.fillStyle = "#b5a36f";
      ctx.fillRect(screenX + 8, screenY + 12, 3, 2);
    } else if (type === "hillside") {
      ctx.fillStyle = "#4a5340";
      ctx.fillRect(screenX, screenY, size, size);
      ctx.fillStyle = "#5c6650";
      ctx.fillRect(screenX + 2, screenY + 2, size - 4, size - 4);
    } else if (type === "forest") {
      ctx.fillStyle = "#142d19";
      ctx.fillRect(screenX, screenY, size, size);
      ctx.fillStyle = "#0c1d10";
      ctx.beginPath();
      ctx.arc(screenX + size/2, screenY + size/2, size/3, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === "mountain") {
      ctx.fillStyle = "#7b889b";
      ctx.fillRect(screenX, screenY, size, size);
      ctx.fillStyle = "#e5e9f0"; // Snow cap
      ctx.fillRect(screenX + 6, screenY + 4, size - 12, 6);
    } else if (type === "ocean") {
      ctx.fillStyle = "#1b324b";
      ctx.fillRect(screenX, screenY, size, size);
      ctx.fillStyle = "#284b6f";
      ctx.fillRect(screenX + 2, screenY + 10, 12, 2);
    } else if (type === "town") {
      ctx.fillStyle = "#3b4252";
      ctx.fillRect(screenX, screenY, size, size);
      ctx.fillStyle = "#4c566a";
      ctx.fillRect(screenX + 2, screenY + 2, size/2 - 3, size/2 - 3);
      ctx.fillRect(screenX + size/2 + 1, screenY + size/2 + 1, size/2 - 3, size/2 - 3);
    }
  }

  static drawObject(ctx, kind, screenX, screenY, size) {
    if (kind === "anvil") {
      ctx.fillStyle = "#d08770";
      ctx.fillRect(screenX + 6, screenY + 12, 20, 10);
      ctx.fillRect(screenX + 10, screenY + 22, 12, 6);
    } else if (kind === "boss") {
      ctx.fillStyle = "#bf616a";
      ctx.beginPath();
      ctx.arc(screenX + size/2, screenY + size/2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ebcb8b";
      ctx.fillRect(screenX + 10, screenY + 6, 12, 4); // Crown
    } else if (kind === "boat_merchant") {
      ctx.fillStyle = "#88c0d0";
      ctx.fillRect(screenX + 4, screenY + 14, 24, 12);
    }
  }
}
