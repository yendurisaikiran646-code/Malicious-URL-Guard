"""Generate extension icons using Pillow."""
import os
from PIL import Image, ImageDraw

ICONS_DIR = os.path.dirname(__file__)

def create_icon(size: int, filename: str):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Outer shield shape or rounded badge
    margin = int(size * 0.08)
    # Background badge
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=int(size * 0.22),
        fill=(6, 182, 212, 255),
        outline=(59, 130, 246, 255),
        width=max(1, int(size * 0.05))
    )

    # Inner emblem (checkmark / shield line)
    cx, cy = size // 2, size // 2
    r = int(size * 0.25)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(11, 15, 25, 255))

    img.save(os.path.join(ICONS_DIR, filename), "PNG")
    print(f"Generated {filename} ({size}x{size})")

if __name__ == "__main__":
    create_icon(16, "icon16.png")
    create_icon(48, "icon48.png")
    create_icon(128, "icon128.png")
