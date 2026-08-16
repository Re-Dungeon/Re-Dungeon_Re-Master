from pathlib import Path
text = Path('src/components/PersonagemFichaDialog/PersonagemFichaDialog.jsx').read_text(encoding='utf-8')
lines = text.splitlines()
for idx in range(1068, 1080):
    line = lines[idx]
    print(f'{idx+1}: {line}')
    for col, ch in enumerate(line, start=1):
        if col in (11, 48):
            print(f'  col {col} = {repr(ch)}')
