import sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ArrayObject, DictionaryObject, FloatObject, NameObject, TextStringObject

pdf_path = sys.argv[1]
video_url = (
    "https://firebasestorage.googleapis.com/v0/b/firebase-me-do.appspot.com/o/"
    "buzzmaster%2Fbuzzmaster_ai_sidekick_v3%20(1080p).mp4"
    "?alt=media&token=71816dfc-ec52-470b-bade-ed234c91ceb2"
)

reader = PdfReader(pdf_path)
writer = PdfWriter()

for i, pg in enumerate(reader.pages):
    writer.add_page(pg)
    if i == 1:  # slide 2 (0-indexed)
        # Video container: right 42% of slide, vertically centered
        # Cover the entire video/still area for easy clicking
        x1 = 1114  # left edge of video container
        x2 = 1860  # right edge (minus padding)
        y1 = 160   # top of video area (PDF y from bottom)
        y2 = 920   # bottom of video area
        link = DictionaryObject()
        link.update({
            NameObject("/Type"): NameObject("/Annot"),
            NameObject("/Subtype"): NameObject("/Link"),
            NameObject("/Rect"): ArrayObject([
                FloatObject(x1), FloatObject(y1),
                FloatObject(x2), FloatObject(y2),
            ]),
            NameObject("/Border"): ArrayObject([
                FloatObject(0), FloatObject(0), FloatObject(0),
            ]),
            NameObject("/A"): DictionaryObject({
                NameObject("/Type"): NameObject("/Action"),
                NameObject("/S"): NameObject("/URI"),
                NameObject("/URI"): TextStringObject(video_url),
            }),
        })
        writer.pages[i][NameObject("/Annots")] = ArrayObject([link])

    if i == len(reader.pages) - 1:  # last slide (CTA)
        annots = []

        def make_link(x1, y1, x2, y2, uri):
            a = DictionaryObject()
            a.update({
                NameObject("/Type"): NameObject("/Annot"),
                NameObject("/Subtype"): NameObject("/Link"),
                NameObject("/Rect"): ArrayObject([
                    FloatObject(x1), FloatObject(y1),
                    FloatObject(x2), FloatObject(y2),
                ]),
                NameObject("/Border"): ArrayObject([
                    FloatObject(0), FloatObject(0), FloatObject(0),
                ]),
                NameObject("/A"): DictionaryObject({
                    NameObject("/Type"): NameObject("/Action"),
                    NameObject("/S"): NameObject("/URI"),
                    NameObject("/URI"): TextStringObject(uri),
                }),
            })
            return a

        # PDF y=0 is bottom. Split at y=400: above=mailto, below=website
        # "Plan een demo" button + info@buzzmaster.nl — upper area
        annots.append(make_link(600, 400, 1320, 700, "mailto:info@buzzmaster.nl"))
        # "buzzmaster.nl" text — lower area
        annots.append(make_link(600, 150, 1320, 400, "https://buzzmaster.nl"))

        writer.pages[i][NameObject("/Annots")] = ArrayObject(annots)

with open(pdf_path, "wb") as f:
    writer.write(f)

print("Added links to slide 2 and last slide")
