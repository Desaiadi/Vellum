"""Generates synthetic clinical billing/discharge documents for the Vellum demo,
rendered as images at varying scan quality (clean / mild noise / degraded).

All patient names, MRNs, NPIs, and clinical details below are fabricated for
demonstration purposes only. This script does not use, store, or process any
real patient health information.
"""

import random
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT_DIR = Path(__file__).parent

DOCS = {
    # (text, quality) — quality in {"high", "medium", "low"}
    "superbill_1_clean": (
        """
SUPERBILL (SYNTHETIC / FOR DEMO ONLY)

Practice: Ridgeline Family Health Associates
Provider: Dr. Elena Marsh, MD          NPI: 1093827465
Patient: Thomas W. Okonkwo (fictional) DOB: 05/18/1979
MRN: SYN-20441                         Date of Service: 01/06/2026
Insurance ID: SYN-INS-88213

DIAGNOSES (ICD-10 POINTER)
1. Type 2 diabetes mellitus without complications
2. Essential hypertension, uncontrolled
3. Hyperlipidemia, unspecified

PROCEDURES / SERVICES
- Office/outpatient visit, established patient, moderate complexity  Qty 1
- Comprehensive metabolic panel, blood draw                          Qty 1
- Hemoglobin A1c test                                                Qty 1

Total charges: $310.00
Provider signature on file.
""",
        "high",
    ),
    "discharge_summary_1_medium": (
        """
DISCHARGE SUMMARY (SYNTHETIC / FOR DEMO ONLY)

Patient: Renee K. Blackwood (fictional)   MRN: SYN-30119
DOB: 09/02/1957                            Admit Date: 12/28/2025
Attending: Dr. Marcus Iyer, MD             Discharge Date: 01/03/2026
Facility: Cedar Point Regional Hospital

ADMITTING DIAGNOSIS:
Acute exacerbation of chronic obstructive pulmonary disease (COPD)
with hypoxemia.

HOSPITAL COURSE:
Patient admitted with worsening dyspnea and productive cough. Started
on IV corticosteroids, nebulized bronchodilators, and supplemental
oxygen. Chest X-ray on admission showed hyperinflation without acute
infiltrate. Sputum culture negative. Patient improved steadily and
was weaned to room air by day 4.

DISCHARGE DIAGNOSES:
1. Acute exacerbation of COPD with hypoxemia, resolved.
2. Chronic obstructive pulmonary disease, moderate, unspecified type.
3. Tobacco use disorder, counseled on cessation.

PROCEDURES PERFORMED:
- Chest X-ray, 2 views, on admission.
- Arterial blood gas analysis, day 1.
- Pulmonary function test, prior to discharge.

DISCHARGE PLAN:
Continue tiotropium inhaler daily and albuterol as needed. Prednisone
taper over 5 days. Follow up with pulmonology in 2 weeks. Smoking
cessation counseling materials provided.
""",
        "medium",
    ),
    "superbill_2_degraded": (
        """
SUPERBILL (SYNTHETIC / FOR DEMO ONLY)

Practice: Harborview Orthopedic Group
Provider: Dr. Amara Solis, DO          NPI: 1847362910
Patient: Diego F. Castellano (fictional) DOB: 02/27/1994
MRN: SYN-40587                          Date of Service: 01/11/2026
Insurance ID: SYN-INS-55902

DIAGNOSES (ICD-10 POINTER)
1. Sprain of anterior cruciate ligament, right knee, initial encounter
2. Joint pain, right knee

PROCEDURES / SERVICES
- Office/outpatient visit, new patient, moderate complexity   Qty 1
- Radiologic exam, knee, 3 views, right                        Qty 1
- Knee immobilizer fitting                                     Qty 1

Total charges: $420.00
Provider signature on file.
""",
        "low",
    ),
}


def _load_font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Courier New.ttf",
        "/System/Library/Fonts/Menlo.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def render_note_to_image(text: str, out_path: Path, quality: str = "medium") -> None:
    """quality: 'high' (clean), 'medium' (mild scan artifacts), 'low' (degraded scan)."""
    width, height = 1275, 1650  # ~8.5x11" at 150dpi
    bg_color = (255, 255, 255) if quality == "high" else (250, 248, 242)
    img = Image.new("RGB", (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)

    font = _load_font(22)
    margin = 70
    y = margin
    wrapper = textwrap.TextWrapper(width=88)

    for line in text.strip("\n").split("\n"):
        wrapped = wrapper.wrap(line) if line.strip() else [""]
        for wline in wrapped:
            draw.text((margin, y), wline, fill=(20, 20, 25), font=font)
            y += 30

    random.seed(hash(out_path.name) % (2**31))

    if quality in ("medium", "low"):
        noise_density = 0.0015 if quality == "medium" else 0.006
        noise_pixels = img.load()
        for _ in range(int(width * height * noise_density)):
            x = random.randint(0, width - 1)
            ny = random.randint(0, height - 1)
            shade = random.randint(160, 230)
            noise_pixels[x, ny] = (shade, shade, shade)

    rotation = {"high": 0.0, "medium": 0.6, "low": 1.8}[quality]
    if rotation:
        img = img.rotate(random.uniform(-rotation, rotation), fillcolor=bg_color, expand=False)

    if quality == "low":
        img = img.filter(ImageFilter.GaussianBlur(radius=1.1))
        # simulate slight downscale/upscale quality loss from a low-res scanner
        small = img.resize((width // 2, height // 2), Image.BILINEAR)
        img = small.resize((width, height), Image.BILINEAR)

    img.save(out_path, "PNG")


def main() -> None:
    for name, (text, quality) in DOCS.items():
        out_path = OUT_DIR / f"{name}.png"
        render_note_to_image(text, out_path, quality=quality)
        print(f"wrote {out_path} (quality={quality})")


if __name__ == "__main__":
    main()
