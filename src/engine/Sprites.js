export class SpriteGenerator {
  // Generates 32x32 character or enemy canvases procedurally
  static createEntitySprite(role, color) {
    const cvs = document.createElement("canvas");
    cvs.width = 32;
    cvs.height = 32;
    const c = cvs.getContext("2d");

    if (role === "player") {
      // Cloaked Adventurer
      c.fillStyle = "#d08770"; // Face
      c.fillRect(11, 8, 10, 8);
      c.fillStyle = color || "#5e81ac"; // Cloak
      c.fillRect(8, 14, 16, 14);
      c.fillStyle = "#2e3440"; // Hood / boots
      c.fillRect(9, 4, 14, 6);
      c.fillRect(9, 28, 5, 4);
      c.fillRect(18, 28, 5, 4);
    } else if (role === "monster") {
      // Horned / armored beast
      c.fillStyle = color || "#bf616a";
      c.fillRect(6, 10, 20, 16);
      c.fillStyle = "#eceff4"; // Eyes
      c.fillRect(9, 14, 3, 3);
      c.fillRect(20, 14, 3, 3);
      c.fillStyle = "#4c566a"; // Horns
      c.fillRect(4, 4, 4, 8);
      c.fillRect(24, 4, 4, 8);
    }
    return cvs;
  }
}
