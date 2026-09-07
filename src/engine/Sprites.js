export class EnvironmentRenderer {
  // Tile ID Reference:
  // 0: Walkable path / clearing
  // 1: Solid Tree / Canopy Wall (collision)
  // 2: Solid Stone Wall / Ruins (collision)
  // 3: Hunting Grounds (Tall Grass / Mist - Triggers Combat)
  // 4: Water / Ocean (impassable without boat)
  // 5: Cobblestone / Plaza
  // 6: Blacksmith Forge Anvil
  // 7: Regional Boss Gate / Entity
  // 8: Temple Entrance

  static drawTile(ctx, tileId, biome, x, y, size) {
    switch (tileId) {
      case 0: // Natural Ground
        if (biome === "forest") {
          ctx.fillStyle = "#2d5a27";
          ctx.fillRect(x, y, size, size);
          ctx.fillStyle = "#3d6e35";
          ctx.fillRect(x + 4, y + 8, 3, 2);
          ctx.fillRect(x + 18, y + 20, 2, 2);
        } else if (biome === "mountains") {
          ctx.fillStyle = "#8fa3ad"; // Snow-dirt blend
          ctx.fillRect(x, y, size, size);
          ctx.fillStyle = "#b8c9d1";
          ctx.fillRect(x + 2, y + 4, 6, 4);
          ctx.fillStyle = "#5c6b73";
          ctx.fillRect(x + 16, y + 18, 4, 3);
        } else {
          ctx.fillStyle = "#4c8535";
          ctx.fillRect(x, y, size, size);
          ctx.fillStyle = "#5c9e42";
          ctx.fillRect(x + 6, y + 10, 4, 2);
        }
        break;

      case 1: // Dense Tree Canopy Border (Forms Tunnel Path)
        // Base ground under canopy
        ctx.fillStyle = biome === "mountains" ? "#72848e" : "#1c3818";
        ctx.fillRect(x, y, size, size);

        if (biome === "mountains") {
          // Snowy Pine Tree
          ctx.fillStyle = "#264653"; // Dark pine needle shadow
          ctx.beginPath();
          ctx.moveTo(x + size / 2, y + 2);
          ctx.lineTo(x + size - 2, y + size - 4);
          ctx.lineTo(x + 2, y + size - 4);
          ctx.fill();

          ctx.fillStyle = "#e0fbfc"; // Snow cap on needles
          ctx.beginPath();
          ctx.moveTo(x + size / 2, y + 2);
          ctx.lineTo(x + size - 6, y + size / 2);
          ctx.lineTo(x + 6, y + size / 2);
          ctx.fill();
        } else {
          // Lush Oak Tree
          ctx.fillStyle = "#0f2812"; // Deep shadow
          ctx.beginPath();
          ctx.arc(x + size / 2, y + size / 2, size / 2 - 1, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#1e4d2b"; // Foliage midtone
          ctx.beginPath();
          ctx.arc(x + size / 2 - 2, y + size / 2 - 2, size / 2 - 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#40916c"; // Foliage highlight
          ctx.beginPath();
          ctx.arc(x + size / 2 - 4, y + size / 2 - 4, size / 4, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 2: // Ruined Stone Wall
        ctx.fillStyle = "#4a5568";
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = "#718096";
        ctx.fillRect(x + 2, y + 2, size - 4, size / 2 - 3);
        ctx.fillRect(x + 4, y + size / 2 + 1, size - 8, size / 2 - 3);
        ctx.fillStyle = "#2d3748"; // Mortar line
        ctx.fillRect(x, y + size / 2 - 1, size, 2);
        break;

      case 3: // Hunting Grounds (Tall Grass & Creature Spores)
        ctx.fillStyle = biome === "mountains" ? "#7c8e99" : "#244d1f";
        ctx.fillRect(x, y, size, size);

        // Visual Grass Tufts
        ctx.fillStyle = "#52b788";
        ctx.fillRect(x + 4, y + 6, 3, 18);
        ctx.fillRect(x + 12, y + 2, 4, 24);
        ctx.fillRect(x + 22, y + 8, 3, 16);

        ctx.fillStyle = "#74c69d"; // Bright blade tips
        ctx.fillRect(x + 4, y + 4, 3, 4);
        ctx.fillRect(x + 12, y + 1, 4, 4);
        ctx.fillRect(x + 22, y + 6, 3, 4);
        break;

      case 4: // Water / River
        ctx.fillStyle = "#1d4e89";
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = "#3a86c8";
        ctx.fillRect(x + 4, y + 8, 12, 2);
        ctx.fillRect(x + 14, y + 20, 10, 2);
        break;

      case 5: // Cobblestone Plaza / Path
        ctx.fillStyle = "#64748b";
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(x + 2, y + 2, 12, 12);
        ctx.fillRect(x + 16, y + 16, 12, 12);
        break;

      case 6: // Anvil Forge
        this.drawTile(ctx, 5, biome, x, y, size);
        ctx.fillStyle = "#d08770";
        ctx.fillRect(x + 6, y + 12, 20, 10);
        ctx.fillRect(x + 10, y + 22, 12, 6);
        break;

      case 7: // Boss Sigil
        this.drawTile(ctx, 3, biome, x, y, size);
        ctx.fillStyle = "#e63946";
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffb703";
        ctx.fillRect(x + size / 2 - 6, y + 4, 12, 5); // Crown
        break;

      case 8: // Temple Gateway Arch
        ctx.fillStyle = "#334155";
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = "#0f172a"; // Portal opening
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 3, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }

  // Multi-Tile Temple Façade (like Reference Image 1)
  static drawTempleStructure(ctx, x, y) {
    // Pediment Roof
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.moveTo(x + 96, y);
    ctx.lineTo(x + 192, y + 48);
    ctx.lineTo(x, y + 48);
    ctx.closePath();
    ctx.fill();

    // Arch frieze carving
    ctx.fillStyle = "#94a3b8";
    ctx.beginPath();
    ctx.arc(x + 96, y + 36, 16, Math.PI, 0);
    ctx.fill();

    // Columns (4 Pillars)
    [24, 68, 116, 160].forEach(colX => {
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(x + colX, y + 48, 12, 60);
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(x + colX - 2, y + 48, 16, 6);
      ctx.fillRect(x + colX - 2, y + 102, 16, 6);
    });

    // Dark Sanctum Doorway
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x + 80, y + 60, 32, 48);

    // Marble Steps
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(x + 16, y + 108, 160, 10);
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(x + 28, y + 118, 136, 8);

    // Flanking Guardian Statues
    [x - 20, x + 180].forEach(statueX => {
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(statueX, y + 50, 24, 50);
      // Wings
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.moveTo(statueX + 12, y + 50);
      ctx.lineTo(statueX + (statueX < x ? -12 : 36), y + 30);
      ctx.lineTo(statueX + 12, y + 80);
      ctx.fill();
    });
  }
}
