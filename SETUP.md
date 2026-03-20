# BuzzMaster Presentatie — Setup voor collega's

## Wat heb je nodig?

1. **Claude Desktop** — download via [claude.ai/desktop](https://claude.ai/desktop)
2. **GitHub Desktop** (optioneel maar aangeraden) — [desktop.github.com](https://desktop.github.com)
3. Deze repo lokaal op je computer (clone via GitHub Desktop of terminal)

## Stap 1: Repo clonen

Via GitHub Desktop: klik op "Clone a repository" en zoek naar `buzzmaster-pres`.

Of via de terminal:
```bash
git clone https://github.com/douwevdijk/buzzmaster-pres.git
cd buzzmaster-pres
```

## Stap 2: Claude Desktop Project aanmaken

1. Open Claude Desktop
2. Maak een nieuw **Project** aan (bijv. "BuzzMaster Presentatie")
3. Plak de volgende **custom instructions** in het project:

---

### Custom Instructions (kopieer dit):

```
Je helpt mij met het bewerken van de BuzzMaster salespresentatie.

Het presentatiebestand is: index.html

De presentatie heeft 10 slides, genummerd met data-slide="1" t/m data-slide="10":
1. Hero/titelpagina
2. AI Sidekick intro + video
3. Features overzicht
4. Slide 4-8: Feature details
9. Klanten/social proof
10. CTA / contact

Regels:
- Bewerk alleen tekst binnen de bestaande HTML-structuur
- Verander geen class-namen, data-attributen of CSS
- Houd teksten kort en krachtig (het is een presentatie)
- Gebruik Nederlandse tekst tenzij ik anders vraag
- Na elke wijziging: vertel me welke slide je hebt aangepast

Na het bewerken: commit en push naar GitHub. De PDF wordt dan automatisch gegenereerd door GitHub Actions.
```

---

## Stap 3: MCP Server toevoegen

Dit geeft Claude toegang om bestanden te lezen en bewerken.

1. Open Claude Desktop → **Settings** → **Developer** → **Edit Config**
2. Voeg dit toe aan je `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "claude-code": {
      "command": "claude",
      "args": ["mcp", "serve"],
      "env": {
        "CLAUDE_CODE_DEFAULT_ALLOWED_TOOLS": "Read,Edit,Write,Glob,Grep,Bash(git *)"
      }
    }
  }
}
```

3. Herstart Claude Desktop

> **Let op:** Je moet Claude Code (CLI) geinstalleerd hebben. Installeer via: `npm install -g @anthropic-ai/claude-code`

## Stap 4: Presentatie bewerken

1. Open je Claude Desktop Project
2. Vraag Claude om aanpassingen, bijv.:
   - "Pas de titel op slide 1 aan naar: Engage Your Audience with AI"
   - "Verander de features op slide 3"
   - "Voeg een nieuwe bullet toe op slide 5"
3. Claude bewerkt `index.html` direct
4. **Bekijk het resultaat:** open `index.html` in je browser
5. **PDF genereren:** vraag Claude om te committen en pushen, of doe dit via GitHub Desktop

## Stap 5: PDF ophalen

Na een push naar `main` genereert GitHub Actions automatisch de PDF.
Je vindt `BuzzMaster-presentatie.pdf` in de repo na ~2 minuten.

## Hulp nodig?

Vraag het aan Douwe!
