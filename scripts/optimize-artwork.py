"""Create delivery assets while retaining the original illustrations."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / "public" / "images"
sources = sorted(root.glob("*.png"))
before = after = 0
for source in sources:
    target = source.with_suffix(".webp")
    with Image.open(source) as image:
        image.thumbnail((768, 768), Image.Resampling.LANCZOS)
        image.save(target, "WEBP", quality=84, method=6)
    before += source.stat().st_size
    after += target.stat().st_size
print(f"{len(sources)} images: {before:,} -> {after:,} bytes ({100 * (1 - after / before):.1f}% smaller)")
