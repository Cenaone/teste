# Ponto de Restauração — Modelo Antigo (IA Gemini)

Criado antes da implementação do modo de transcrição local gratuita (`vosk-browser` / WebAssembly).

## Opção 1: Restauração instantânea pelo próprio sistema (sem código)
Na tela **Gravação de Áudio & Transcrição da Sessão**, clique em **"Restaurar Modelo Antigo (IA Gemini)"** (ou selecione **"IA Gemini (Clássico)"** no seletor de motor de transcrição). O sistema volta imediatamente a transcrever pelo servidor com Gemini.

## Opção 2: Restauração completa dos arquivos originais
Os arquivos exatos anteriores a este teste estão preservados nesta pasta:
- `GravadorSessao.tsx.bak` -> restaurar para `src/components/GravadorSessao.tsx`
- `transcrever-audio.ts.bak` -> restaurar para `api/transcrever-audio.ts`
- `package.json.bak` -> restaurar para `package.json`

Comando rápido no terminal (a partir da raiz do projeto):
```bash
cp backups/ponto-restauracao-modelo-antigo/GravadorSessao.tsx.bak src/components/GravadorSessao.tsx
cp backups/ponto-restauracao-modelo-antigo/transcrever-audio.ts.bak api/transcrever-audio.ts
```
