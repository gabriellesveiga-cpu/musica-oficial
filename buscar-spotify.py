import json
import urllib.parse
import urllib.request

ARQUIVO = "Dados/playlists.json"
SAIDA = "Dados/resultados-spotify.json"

with open(ARQUIVO, "r", encoding="utf-8-sig") as f:
    musicas = json.load(f)

print("=" * 60)
print("BUSCA DE MÚSICAS NO SPOTIFY")
print("=" * 60)

resultados = []

for numero, musica in enumerate(musicas, 1):

    nome = musica.get("nome", "").strip()

    if not nome:
        continue

    print(f"\n[{numero}/{len(musicas)}] Procurando: {nome}")

    consulta = urllib.parse.quote(nome)

    url = (
        "http://127.0.0.1:3000/buscar-musica"
        f"?nome={consulta}"
    )

    try:
        with urllib.request.urlopen(url, timeout=30) as resposta:
            dados = json.loads(resposta.read().decode("utf-8"))

        if isinstance(dados, list) and len(dados) > 0:

            melhor = dados[0]

            resultado = {
                "arquivo": musica.get("arquivo", ""),
                "nome_original": nome,
                "nome_spotify": melhor.get("nome", ""),
                "artista_spotify": melhor.get("artista", ""),
                "album_spotify": melhor.get("album", ""),
                "capa_spotify": melhor.get("capa", ""),
                "spotifyId": melhor.get("spotifyId", ""),
                "spotifyUrl": melhor.get("spotifyUrl", "")
            }

            resultados.append(resultado)

            print(
                "   ✓",
                melhor.get("nome", ""),
                "—",
                melhor.get("artista", "")
            )

        else:
            print("   ✗ Nenhum resultado encontrado.")

    except Exception as erro:
        print("   ✗ Erro:", erro)

with open(SAIDA, "w", encoding="utf-8") as f:
    json.dump(resultados, f, ensure_ascii=False, indent=2)

print("\n" + "=" * 60)
print("ANÁLISE CONCLUÍDA")
print("=" * 60)
print("Total analisado:", len(musicas))
print("Resultados encontrados:", len(resultados))
print("Arquivo criado:", SAIDA)
print("=" * 60)