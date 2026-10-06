import requests

nome_musica = "Mantra"
artista = "JENNIE"

url = "https://itunes.apple.com/search"

params = {
    "term": f"{nome_musica} {artista}",
    "media": "music",
    "entity": "song",
    "limit": 10
}

resposta = requests.get(url, params=params)

if resposta.status_code != 200:
    print("❌ Erro ao consultar a API.")
    exit()

dados = resposta.json()

print("\n🎵 RESULTADOS ENCONTRADOS:\n")

for i, musica in enumerate(dados["results"], start=1):

    print(f"{i}. {musica.get('trackName')}")
    print(f"   Artista: {musica.get('artistName')}")
    print(f"   Álbum: {musica.get('collectionName')}")
    print(f"   Capa: {musica.get('artworkUrl100')}")
    print()